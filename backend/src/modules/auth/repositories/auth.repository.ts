import { Inject, Injectable } from '@nestjs/common';
import { RefreshTokenStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  updateLastLoginAt(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  createRefreshToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  findActiveRefreshTokensByUserId(userId: number) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        status: RefreshTokenStatus.ACTIVE,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  revokeRefreshToken(id: number) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { status: RefreshTokenStatus.REVOKED },
    });
  }
}
