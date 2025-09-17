import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('me')
  me() {
    return { message: 'This is a protected route' };
  }
}
