import { ActivityRetentionRepository } from '../repositories/activity-retention.repository';
import { ActivityRetentionService } from './activity-retention.service';

describe('ActivityRetentionService', () => {
  let repository: jest.Mocked<ActivityRetentionRepository>;
  let service: ActivityRetentionService;

  beforeEach(() => {
    repository = {
      findOrganizationPolicies: jest.fn().mockResolvedValue([]),
      deleteExpiredActivityEvents: jest.fn().mockResolvedValue(0),
      deleteExpiredResourceSessions: jest.fn().mockResolvedValue(0),
      deleteExpiredUserSessions: jest.fn().mockResolvedValue(0),
      deleteExpiredAuthenticationAttempts: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<ActivityRetentionRepository>;
    service = new ActivityRetentionService(repository);
  });

  it('uses each organization policy and the default unscoped policy', async () => {
    repository.findOrganizationPolicies.mockResolvedValue([
      {
        id: 4,
        activityPolicy: {
          activityRetentionDays: 90,
          failedLoginRetentionDays: 30,
        },
      },
      { id: 8, activityPolicy: null },
    ]);
    const now = new Date('2026-08-28T12:00:00.000Z');

    const result = await service.enforceRetention(now);

    expect(result.scopesProcessed).toBe(3);
    expect(repository.deleteExpiredActivityEvents.mock.calls).toContainEqual([
      {
        organizationId: 4,
        activityCutoff: new Date('2026-05-30T12:00:00.000Z'),
        failedLoginCutoff: new Date('2026-07-29T12:00:00.000Z'),
      },
      1_000,
    ]);
    expect(
      repository.deleteExpiredAuthenticationAttempts.mock.calls,
    ).toContainEqual([
      expect.objectContaining({ organizationId: null }),
      1_000,
    ]);
  });

  it('continues deleting full batches and aggregates all record types', async () => {
    repository.deleteExpiredActivityEvents
      .mockResolvedValueOnce(1_000)
      .mockResolvedValueOnce(25);
    repository.deleteExpiredResourceSessions.mockResolvedValueOnce(6);
    repository.deleteExpiredUserSessions.mockResolvedValueOnce(4);
    repository.deleteExpiredAuthenticationAttempts.mockResolvedValueOnce(3);

    const result = await service.enforceRetention(
      new Date('2026-08-28T12:00:00.000Z'),
    );

    expect(result.deleted).toEqual({
      authenticationAttempts: 3,
      userSessions: 4,
      resourceSessions: 6,
      activityEvents: 1_025,
    });
    expect(result.batchLimitReached).toBe(false);
    expect(repository.deleteExpiredActivityEvents.mock.calls).toHaveLength(2);
  });
});
