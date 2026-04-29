import { ApiProperty } from '@nestjs/swagger';

export class RoomResponseDto {
  @ApiProperty({ description: 'Unique room ID', example: 'room_x9y8z7' })
  id: string;

  @ApiProperty({ description: 'Room name', example: 'general' })
  name: string;

  @ApiProperty({
    description: 'Username of the room creator',
    example: 'ali_123',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Room creation timestamp',
    example: '2024-03-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Number of active users in the room',
    example: 4,
  })
  activeUsers?: number;
}
