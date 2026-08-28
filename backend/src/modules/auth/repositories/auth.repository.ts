import { Inject, Injectable } from '@nestjs/common';
import {
  RefreshTokenRevocationReason,
  RefreshTokenStatus,
} from '@prisma/client';

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
      include: {
        student: {
          select: { id: true, organizationId: true },
        },
      },
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
    userActivitySessionId?: number | null,
  ) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        userActivitySessionId,
      },
    });
  }

  findActiveRefreshTokensByUserId(userId: number, includeExpired = false) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        status: RefreshTokenStatus.ACTIVE,
        expiresAt: includeExpired ? undefined : { gt: new Date() },
      },
      include: {
        userActivitySession: {
          select: { id: true, uuid: true, endedAt: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  revokeRefreshToken(id: number, reason: RefreshTokenRevocationReason) {
    return this.prisma.refreshToken.updateMany({
      where: { id, status: RefreshTokenStatus.ACTIVE },
      data: {
        status: RefreshTokenStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    });
  }
}
