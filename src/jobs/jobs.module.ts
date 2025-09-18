import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup/cleanup.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BlacklistService } from '~/api/v1/auth/blacklist/blacklist.service';
import { RefreshTokenService } from '~/api/v1/auth/refresh-token/refresh-token.service';

@Module({
  providers: [
    CleanupService,
    ConfigService,
    JwtService,
    BlacklistService,
    RefreshTokenService,
  ],
})
export class JobsModule {}
