// src/user/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Unique user ID', example: 'usr_a1b2c3' })
  id: string;

  @ApiProperty({ description: 'Username', example: 'ali_123' })
  username: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-03-01T10:00:00Z',
  })
  createdAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Session token for authentication',
    example: 'sess_8f9a2b3c4d5e6f7g8h9i0j',
  })
  sessionToken: string;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  user: UserResponseDto;
}
