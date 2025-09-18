import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlacklistService } from '~/api/v1/auth/blacklist/blacklist.service';
import { RefreshTokenService } from '~/api/v1/auth/refresh-token/refresh-token.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly refreshToken: RefreshTokenService,
    private readonly blacklist: BlacklistService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async cleanupExpiredTokens() {
    try {
      this.logger.log('Starting cleanup of expired tokens');

      const deletedRefreshTokens =
        await this.refreshToken.cleanupExpiredTokens();
      const deletedBlacklistTokens =
        await this.blacklist.cleanupExpiredTokens();

      this.logger.log(
        `Cleanup completed: ${deletedRefreshTokens} refresh tokens and ${deletedBlacklistTokens} blacklist tokens deleted`,
      );
    } catch (error) {
      this.logger.error('Token cleanup failed:', error);
    }
  }
}
