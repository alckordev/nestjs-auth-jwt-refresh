import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '~/database/database.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import ms, { StringValue } from '@iscodex/ms-parser';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async generateRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    try {
      const refreshToken = crypto.randomBytes(64).toString('hex');

      const lookupHash = this.getLookupHash(refreshToken);

      const encryptedToken = await bcrypt.hash(refreshToken, 10);

      const expiresAt = new Date();
      const expirationMs = ms(
        this.config.get<StringValue>('JWT_REFRESH_EXPIRES_IN', '7d'),
      );
      const expirationDays = Math.ceil(expirationMs / (1000 * 60 * 60 * 24));

      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      await this.db.refreshToken.create({
        data: {
          userId,
          token: encryptedToken,
          lookupHash,
          userAgent,
          ipAddress,
          expiresAt,
        },
      });

      return refreshToken;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const lookupHash = this.getLookupHash(refreshToken);

    const tokenRecord = await this.db.refreshToken.findUnique({
      where: {
        lookupHash,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, tokenRecord.token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.revokeToken(tokenRecord.id);

    const newRefreshToken = await this.generateRefreshToken(
      tokenRecord.userId,
      tokenRecord.userAgent,
      tokenRecord.ipAddress,
    );

    return {
      user: tokenRecord.user,
      refreshToken: newRefreshToken,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const lookupHash = this.getLookupHash(refreshToken);

    const tokenRecord = await this.db.refreshToken.findFirst({
      where: {
        lookupHash,
        revokedAt: null,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isValid = await bcrypt.compare(refreshToken, tokenRecord.token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.revokeToken(tokenRecord.id);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.db.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  private getLookupHash(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
  }

  private async revokeToken(tokenId: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }
}
