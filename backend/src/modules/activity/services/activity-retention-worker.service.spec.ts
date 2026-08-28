import { ConfigService } from '@nestjs/config';

import {
  ACTIVITY_RETENTION_INITIAL_DELAY_MS,
  ACTIVITY_RETENTION_INTERVAL_MS,
} from '../constants/activity.constants';
import { ActivityRetentionService } from './activity-retention.service';
import { ActivityRetentionWorkerService } from './activity-retention-worker.service';

describe('ActivityRetentionWorkerService', () => {
  let configService: jest.Mocked<ConfigService>;
  let retentionService: jest.Mocked<ActivityRetentionService>;

  beforeEach(() => {
    jest.useFakeTimers();
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    retentionService = {
      enforceRetention: jest.fn().mockResolvedValue({
        startedAt: new Date(),
        completedAt: new Date(),
        scopesProcessed: 1,
        deleted: {
          authenticationAttempts: 0,
          userSessions: 0,
          resourceSessions: 0,
          activityEvents: 0,
        },
        batchLimitReached: false,
      }),
    } as unknown as jest.Mocked<ActivityRetentionService>;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not schedule cleanup when the worker is disabled', async () => {
    configService.get.mockReturnValue(false);
    const worker = new ActivityRetentionWorkerService(
      configService,
      retentionService,
    );

    worker.onModuleInit();
    await jest.advanceTimersByTimeAsync(ACTIVITY_RETENTION_INITIAL_DELAY_MS);

    expect(retentionService.enforceRetention.mock.calls).toHaveLength(0);
  });

  it('runs after startup and schedules the next daily cleanup', async () => {
    configService.get.mockReturnValue(true);
    const worker = new ActivityRetentionWorkerService(
      configService,
      retentionService,
    );

    worker.onModuleInit();
    await jest.advanceTimersByTimeAsync(ACTIVITY_RETENTION_INITIAL_DELAY_MS);
    expect(retentionService.enforceRetention.mock.calls).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(ACTIVITY_RETENTION_INTERVAL_MS);
    expect(retentionService.enforceRetention.mock.calls).toHaveLength(2);

    worker.onModuleDestroy();
  });
});
