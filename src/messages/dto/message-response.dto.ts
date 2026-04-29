import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ description: 'Unique message ID', example: 'msg_ab12cd' })
  id: string;

  @ApiProperty({
    description: 'Room ID the message belongs to',
    example: 'room_x9y8z7',
  })
  roomId: string;

  @ApiProperty({ description: 'Username of the sender', example: 'ali_123' })
  username: string;

  @ApiProperty({ description: 'Message content', example: 'hello everyone' })
  content: string;

  @ApiProperty({
    description: 'Message timestamp',
    example: '2024-03-01T10:05:22Z',
  })
  createdAt: Date;
}

export class MessagesListResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({
    description: 'Whether there are more messages to load',
    example: true,
  })
  hasMore: boolean;

  @ApiProperty({
    description: 'Cursor for next page of messages',
    example: 'msg_zz9900',
    nullable: true,
  })
  nextCursor: string | null;
}
