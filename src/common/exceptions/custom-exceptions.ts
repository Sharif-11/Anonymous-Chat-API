import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationErrorException extends HttpException {
  constructor(message: string) {
    super(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: message,
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Missing or expired session token') {
    super(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: message,
        },
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string) {
    super(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: message,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class RoomNotFoundException extends HttpException {
  constructor(roomId: string) {
    super(
      {
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `Room with id ${roomId} does not exist`,
        },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class RoomNameTakenException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        error: {
          code: 'ROOM_NAME_TAKEN',
          message: 'A room with this name already exists',
        },
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class MessageTooLongException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        error: {
          code: 'MESSAGE_TOO_LONG',
          message: 'Message content must not exceed 1000 characters',
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class MessageEmptyException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        error: {
          code: 'MESSAGE_EMPTY',
          message: 'Message content cannot be empty',
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
