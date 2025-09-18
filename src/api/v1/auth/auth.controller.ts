import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body() data: RegisterDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') ipAddress?: string,
  ) {
    return this.auth.signUp(data, userAgent, ipAddress);
  }

  @Public()
  @Post('login')
  login(
    @Body() data: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') ipAddress?: string,
  ) {
    return this.auth.signIn(data, userAgent, ipAddress);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() data: RefreshTokenDto) {
    return this.auth.refreshAccessToken(data.refreshToken);
  }

  @Get('me')
  me(@Req() req: Request) {
    return req['user'];
  }
}
