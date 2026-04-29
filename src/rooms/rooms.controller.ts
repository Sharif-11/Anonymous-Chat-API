import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../user/auth.guard';

import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(AuthGuard)
@ApiBearerAuth('session-token')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  @ApiResponse({ status: 200, description: 'Rooms retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllRooms(@Req() req) {
    const rooms = await this.roomsService.getAllRooms();

    return {
      success: true,
      data: {
        rooms,
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Room name already exists' })
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Req() req) {
    const room = await this.roomsService.createRoom(
      createRoomDto.name,
      req.user.username,
    );

    return {
      success: true,
      data: room,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room details' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Room found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getRoom(@Param('id') id: string) {
    const room = await this.roomsService.getRoomById(id);

    return {
      success: true,
      data: room,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a room' })
  @ApiParam({ name: 'id', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Room deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async deleteRoom(@Param('id') id: string, @Req() req) {
    const result = await this.roomsService.deleteRoom(id, req.user.username);

    return {
      success: true,
      data: result,
    };
  }

  // ============ MESSAGES ENDPOINTS ============

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get paginated message history' })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'room_x9y8z7' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to return (max 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
    description: 'Message ID cursor for pagination',
    example: 'msg_ab12cd',
  })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getMessages(
    @Param('id') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const messages = await this.roomsService.getMessages(
      roomId,
      parsedLimit,
      before,
    );

    return {
      success: true,
      data: messages,
    };
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message to the room' })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'room_x9y8z7' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 422, description: 'Message too long or empty' })
  async sendMessage(
    @Param('id') roomId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req,
  ) {
    const message = await this.roomsService.sendMessage(
      roomId,
      req.user.username,
      createMessageDto.content,
    );

    return {
      success: true,
      data: message,
    };
  }
}
