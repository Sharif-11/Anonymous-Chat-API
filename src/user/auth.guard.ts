import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '../common/exceptions/custom-exceptions';
import { UserService } from './user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await this.userService.getUserFromSession(sessionToken);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Attach user and token to request
    request.user = user;
    request.sessionToken = sessionToken;

    return true;
  }
}
