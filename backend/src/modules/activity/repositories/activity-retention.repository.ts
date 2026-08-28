import { Injectable } from '@nestjs/common';
import { AuthenticationAttemptOutcome, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

type RetentionScope = {
  organizationId: number | null;
  activityCutoff: Date;
  failedLoginCutoff: Date;
};

type IdDelegate = {
  findMany(args: object): Promise<Array<{ id: number }>>;
  deleteMany(args: object): Promise<{ count: number }>;
};

@Injectable()
export class ActivityRetentionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrganizationPolicies() {
    return this.prisma.organization.findMany({
      select: {
        id: true,
        activityPolicy: {
          select: {
            activityRetentionDays: true,
            failedLoginRetentionDays: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  deleteExpiredActivityEvents(scope: RetentionScope, take: number) {
    if (scope.organizationId === null) return Promise.resolve(0);

    return this.deleteBatch(
      this.prisma.studentActivityEvent,
      {
        organizationId: scope.organizationId,
        occurredAt: { lt: scope.activityCutoff },
      } satisfies Prisma.StudentActivityEventWhereInput,
      take,
    );
  }

  deleteExpiredResourceSessions(scope: RetentionScope, take: number) {
    if (scope.organizationId === null) return Promise.resolve(0);

    return this.deleteBatch(
      this.prisma.studentResourceActivitySession,
      {
        organizationId: scope.organizationId,
        endedAt: { not: null, lt: scope.activityCutoff },
      } satisfies Prisma.StudentResourceActivitySessionWhereInput,
      take,
    );
  }

  deleteExpiredUserSessions(scope: RetentionScope, take: number) {
    return this.deleteBatch(
      this.prisma.userActivitySession,
      {
        organizationId: scope.organizationId,
        endedAt: { not: null, lt: scope.activityCutoff },
      } satisfies Prisma.UserActivitySessionWhereInput,
      take,
    );
  }

  deleteExpiredAuthenticationAttempts(scope: RetentionScope, take: number) {
    return this.deleteBatch(
      this.prisma.authenticationAttempt,
      {
        organizationId: scope.organizationId,
        OR: [
          {
            outcome: AuthenticationAttemptOutcome.SUCCESS,
            occurredAt: { lt: scope.activityCutoff },
          },
          {
            outcome: AuthenticationAttemptOutcome.FAILED,
            occurredAt: { lt: scope.failedLoginCutoff },
          },
        ],
      } satisfies Prisma.AuthenticationAttemptWhereInput,
      take,
    );
  }

  private async deleteBatch(delegate: IdDelegate, where: object, take: number) {
    const rows = await delegate.findMany({
      where,
      select: { id: true },
      orderBy: { id: 'asc' },
      take,
    });
    if (rows.length === 0) return 0;

    const deleted = await delegate.deleteMany({
      where: { id: { in: rows.map(({ id }) => id) } },
    });
    return deleted.count;
  }
}
