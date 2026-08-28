import { AuthenticationAttemptOutcome } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityRetentionRepository } from './activity-retention.repository';

describe('ActivityRetentionRepository', () => {
  const scope = {
    organizationId: 4,
    activityCutoff: new Date('2025-01-01T00:00:00.000Z'),
    failedLoginCutoff: new Date('2026-01-01T00:00:00.000Z'),
  };
  let prisma: {
    studentActivityEvent: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    studentResourceActivitySession: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    userActivitySession: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    authenticationAttempt: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let repository: ActivityRetentionRepository;

  beforeEach(() => {
    const delegate = () => ({
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    });
    prisma = {
      studentActivityEvent: delegate(),
      studentResourceActivitySession: delegate(),
      userActivitySession: delegate(),
      authenticationAttempt: delegate(),
    };
    repository = new ActivityRetentionRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('only selects closed sessions older than the activity cutoff', async () => {
    await repository.deleteExpiredResourceSessions(scope, 1_000);
    await repository.deleteExpiredUserSessions(scope, 1_000);

    expect(prisma.studentResourceActivitySession.findMany).toHaveBeenCalledWith(
      {
        where: {
          organizationId: 4,
          endedAt: { not: null, lt: scope.activityCutoff },
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: 1_000,
      },
    );
    expect(prisma.userActivitySession.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 4,
        endedAt: { not: null, lt: scope.activityCutoff },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 1_000,
    });
  });

  it('applies separate cutoffs to successful and failed authentication', async () => {
    await repository.deleteExpiredAuthenticationAttempts(scope, 1_000);

    expect(prisma.authenticationAttempt.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 4,
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
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 1_000,
    });
  });

  it('deletes only the ids selected for a bounded batch', async () => {
    prisma.studentActivityEvent.findMany.mockResolvedValue([
      { id: 10 },
      { id: 12 },
    ]);
    prisma.studentActivityEvent.deleteMany.mockResolvedValue({ count: 2 });

    await expect(
      repository.deleteExpiredActivityEvents(scope, 2),
    ).resolves.toBe(2);
    expect(prisma.studentActivityEvent.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 12] } },
    });
  });
});
