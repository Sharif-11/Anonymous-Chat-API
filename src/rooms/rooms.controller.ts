import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../user/auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(AuthGuard)
@ApiBearerAuth('session-token')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all rooms',
    description: 'Returns all chat rooms with active user counts',
  })
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
  @ApiOperation({
    summary: 'Create a new room',
    description: 'Creates a new chat room with unique name',
  })
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
  @ApiOperation({
    summary: 'Get room details',
    description: 'Returns detailed information about a specific room',
  })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'room_x9y8z7' })
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
  @ApiOperation({
    summary: 'Delete a room',
    description:
      'Deletes a room and all its messages. Only room creator can delete.',
  })
  @ApiParam({ name: 'id', description: 'Room ID', example: 'room_x9y8z7' })
  @ApiResponse({ status: 200, description: 'Room deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the room creator' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async deleteRoom(@Param('id') id: string, @Req() req) {
    const result = await this.roomsService.deleteRoom(id, req.user.username);

    return {
      success: true,
      data: result,
    };
  }
}
