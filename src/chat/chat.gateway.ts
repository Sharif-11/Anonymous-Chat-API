import { Inject, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createClient } from 'redis';
import { Server, Socket } from 'socket.io';
import { UserService } from '../user/user.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private pubClient: any;
  private subClient: any;
  private clientRooms: Map<string, string> = new Map();

  constructor(
    private userService: UserService,
    @Inject('REDIS_CLIENT') private redisClient: any,
  ) {}

  async afterInit() {
    try {
      console.log('🔄 Initializing WebSocket Gateway with Redis adapter...');

      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.pubClient = createClient({ url: redisUrl });
      this.subClient = this.pubClient.duplicate();

      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

      // Subscribe to Redis channels
      await this.subClient.subscribe('message:new', (message) => {
        const data = JSON.parse(message);
        this.server.to(data.roomId).emit('message:new', data.message);
      });

      await this.subClient.subscribe('room:deleted', (message) => {
        const { roomId } = JSON.parse(message);
        this.server.to(roomId).emit('room:deleted', { roomId });
        // Force disconnect all clients in this room
        const roomSockets = this.server.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const socket = this.server.sockets.sockets.get(socketId);
            if (socket) {
              socket.disconnect();
            }
          }
        }
      });

      await this.subClient.subscribe('room:user_joined', (message) => {
        const { roomId, username, activeUsers } = JSON.parse(message);
        this.server
          .to(roomId)
          .emit('room:user_joined', { username, activeUsers });
      });

      await this.subClient.subscribe('room:user_left', (message) => {
        const { roomId, username, activeUsers } = JSON.parse(message);
        this.server
          .to(roomId)
          .emit('room:user_left', { username, activeUsers });
      });

      console.log('✅ WebSocket Gateway initialized');
    } catch (error) {
      console.error('Failed to initialize WebSocket Gateway:', error);
    }
  }

  async handleConnection(client: Socket) {
    try {
      const { token, roomId } = client.handshake.query;

      if (!token || !roomId) {
        console.log('❌ Connection rejected: Missing token or roomId');
        client.emit('error', {
          code: '401',
          message: 'Missing token or roomId',
        });
        client.disconnect();
        return;
      }

      // Validate session token
      const user = await this.userService.getUserFromSession(token as string);
      if (!user) {
        console.log('❌ Connection rejected: Invalid or expired token');
        client.emit('error', {
          code: '401',
          message: 'Invalid or expired session token',
        });
        client.disconnect();
        return;
      }

      // Validate room exists by checking Redis or database
      let roomExists = false;
      try {
        const exists = await this.redisClient.get(`room:${roomId}:exists`);
        if (exists) {
          roomExists = true;
        } else {
          // Check database as fallback
          const { drizzle } = require('drizzle-orm/node-postgres');
          const { Pool } = require('pg');
          const { rooms } = require('../db/schemas');
          const { eq } = require('drizzle-orm');

          const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
          });
          const db = drizzle(pool);

          const result = await db
            .select()
            .from(rooms)
            .where(eq(rooms.id, roomId))
            .limit(1);
          await pool.end();

          if (result.length) {
            roomExists = true;
            // Cache room existence in Redis
            await this.redisClient.setEx(`room:${roomId}:exists`, 3600, 'true');
          }
        }
      } catch (error) {
        console.error('Room validation error:', error);
      }

      if (!roomExists) {
        console.log('❌ Connection rejected: Room not found');
        client.emit('error', { code: '404', message: 'Room not found' });
        client.disconnect();
        return;
      }

      client.data.username = user.username;
      client.data.userId = user.id;
      client.data.roomId = roomId;
      this.clientRooms.set(client.id, roomId as string);

      await client.join(roomId as string);

      // Use set add for Redis v4+
      await this.redisClient.sAdd(`room:${roomId}:users`, user.username);

      const activeUsers = await this.redisClient.sMembers(
        `room:${roomId}:users`,
      );

      client.emit('room:joined', { activeUsers });

      await this.pubClient.publish(
        'room:user_joined',
        JSON.stringify({
          roomId,
          username: user.username,
          activeUsers,
        }),
      );

      console.log(`✅ User ${user.username} joined room ${roomId}`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.emit('error', { code: '500', message: 'Internal server error' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const roomId = this.clientRooms.get(client.id);
    const username = client.data?.username;

    if (roomId && username) {
      // Use sRem for Redis v4+
      await this.redisClient.sRem(`room:${roomId}:users`, username);

      const activeUsers = await this.redisClient.sMembers(
        `room:${roomId}:users`,
      );

      await this.pubClient.publish(
        'room:user_left',
        JSON.stringify({
          roomId,
          username,
          activeUsers,
        }),
      );

      console.log(`❌ User ${username} disconnected from room ${roomId}`);
    }

    this.clientRooms.delete(client.id);
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const roomId = this.clientRooms.get(client.id);
    const username = client.data?.username;

    if (roomId && username) {
      await this.redisClient.sRem(`room:${roomId}:users`, username);

      const activeUsers = await this.redisClient.sMembers(
        `room:${roomId}:users`,
      );

      await this.pubClient.publish(
        'room:user_left',
        JSON.stringify({
          roomId,
          username,
          activeUsers,
        }),
      );

      await client.leave(roomId);
      this.clientRooms.delete(client.id);
      console.log(`👋 User ${username} voluntarily left room ${roomId}`);
    }

    client.disconnect();
  }

  async broadcastNewMessage(roomId: string, message: any) {
    await this.pubClient.publish(
      'message:new',
      JSON.stringify({
        roomId,
        message: {
          id: message.id,
          username: message.username,
          content: message.content,
          createdAt: message.createdAt,
        },
      }),
    );
  }

  async broadcastRoomDeleted(roomId: string) {
    await this.pubClient.publish('room:deleted', JSON.stringify({ roomId }));
  }
}
