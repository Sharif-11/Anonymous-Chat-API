import { Module } from '@nestjs/common';
import { MessagesRepository } from '../rooms/messages.repository';
import { MessagesService } from './messages.service';
// Remove RoomsModule import - we'll use forwardRef or restructure

@Module({
  imports: [], // Remove RoomsModule from here
  providers: [MessagesService, MessagesRepository],
  exports: [MessagesService, MessagesRepository],
})
export class MessagesModule {}
