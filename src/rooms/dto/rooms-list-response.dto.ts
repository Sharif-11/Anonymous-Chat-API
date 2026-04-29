import { ApiProperty } from '@nestjs/swagger';
import { RoomResponseDto } from './room-response.dto';

export class RoomsListResponseDto {
  @ApiProperty({ type: [RoomResponseDto] })
  rooms: RoomResponseDto[];
}
