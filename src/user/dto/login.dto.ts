import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username for the chat',
    example: 'ali_123',
    minLength: 2,
    maxLength: 24,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @IsString({ message: 'username must be a string' })
  @Length(2, 24, { message: 'username must be between 2 and 24 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      'username can only contain alphanumeric characters and underscores',
  })
  username: string;
}
