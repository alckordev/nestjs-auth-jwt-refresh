import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '~/database/database.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class BlacklistService {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: DatabaseService,
  ) {}

  async addToBlacklist(token: string): Promise<void> {
    const decoded: JwtPayload = this.jwt.decode(token);

    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 1000 * 60 * 60);

    await this.db.blacklistedToken.create({
      data: {
        token,
        expiresAt,
      },
    });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.db.blacklistedToken.findUnique({
      where: {
        token,
        expiresAt: { gte: new Date() },
      },
    });

    return blacklisted !== null;
  }

  async removeFromBlacklist(token: string): Promise<void> {
    await this.db.blacklistedToken.deleteMany({
      where: { token },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.db.blacklistedToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}
