import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '~/database/database.service';
import { RefreshTokenService } from './refresh-token/refresh-token.service';
import { BlacklistService } from './blacklist/blacklist.service';
import { User } from 'generated/prisma';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './types/jwt-payload';
import { TokenPair } from './types/token-pair';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: DatabaseService,
    private readonly refreshToken: RefreshTokenService,
    private readonly blacklist: BlacklistService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.db.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  private async generateTokens(
    user: User,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwt.sign(payload);

    const refreshToken = await this.refreshToken.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async signUp(
    data: any,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TokenPair> {
    const existingUser = await this.db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.db.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user, userAgent, ipAddress);
  }

  async signIn(data: any, userAgent?: string, ipAddress?: string) {
    const user = await this.validateUser(data.email, data.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user, userAgent, ipAddress);
  }

  async signOut(accessToken: string, refreshToken: string): Promise<void> {
    await this.db.$transaction(async () => {
      await this.blacklist.addToBlacklist(accessToken);
      await this.refreshToken.revokeRefreshToken(refreshToken);
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const record = await this.refreshToken.refreshAccessToken(refreshToken);

    const payload: JwtPayload = {
      sub: record.user.id,
      email: record.user.email,
    };

    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      refreshToken: record.refreshToken,
    };
  }

  async signOutAllDevices(userId: string, accessToken: string): Promise<void> {
    await this.db.$transaction(async () => {
      await this.refreshToken.revokeAllUserTokens(userId);
      await this.blacklist.addToBlacklist(accessToken);
    });
  }
}
