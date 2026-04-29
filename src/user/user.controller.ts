import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private userService: UserService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto) {
    const result = await this.userService.login(loginDto.username);

    return {
      success: true,
      data: {
        sessionToken: result.sessionToken,
        user: {
          id: result.user.id,
          username: result.user.username,
          createdAt: result.user.createdAt,
        },
      },
    };
  }
}
