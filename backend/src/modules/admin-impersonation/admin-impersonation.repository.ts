import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

interface CreateLogInput {
  adminUserId: bigint;
  expiresAt: Date;
  id: string;
  ipAddress?: string | null;
  reason?: string | null;
  studentId: bigint;
  tokenId: string;
  userAgent?: string | null;
}

@Injectable()
export class AdminImpersonationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(input: CreateLogInput) {
    return this.prisma.adminImpersonationLog.create({
      data: {
        adminUserId: input.adminUserId,
        expiresAt: input.expiresAt,
        id: input.id,
        ipAddress: input.ipAddress ?? null,
        reason: input.reason ?? null,
        studentId: input.studentId,
        tokenId: input.tokenId,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.adminImpersonationLog.findUnique({
      where: { id },
    });
  }

  async findActiveByToken(logId: string, tokenId: string) {
    return this.prisma.adminImpersonationLog.findFirst({
      where: {
        endedAt: null,
        expiresAt: {
          gt: new Date(),
        },
        id: logId,
        tokenId,
      },
    });
  }

  async endActiveLog(logId: string, tokenId: string) {
    await this.prisma.adminImpersonationLog.updateMany({
      data: {
        endedAt: new Date(),
      },
      where: {
        endedAt: null,
        id: logId,
        tokenId,
      },
    });

    return this.findById(logId);
  }
}
