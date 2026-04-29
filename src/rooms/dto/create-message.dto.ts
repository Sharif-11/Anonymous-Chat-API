import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'hello everyone',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @Length(1, 1000, {
    message: 'Message content must be between 1 and 1000 characters',
  })
  content: string;
}
