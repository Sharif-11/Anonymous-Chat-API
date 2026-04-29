import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Room name',
    example: 'general',
    minLength: 3,
    maxLength: 32,
    pattern: '^[a-zA-Z0-9-]+$',
  })
  @IsString({ message: 'room name must be a string' })
  @Length(3, 32, { message: 'room name must be between 3 and 32 characters' })
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'room name can only contain alphanumeric characters and hyphens',
  })
  name: string;
}
