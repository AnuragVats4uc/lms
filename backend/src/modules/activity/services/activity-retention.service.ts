import { Injectable } from '@nestjs/common';

import {
  ACTIVITY_RETENTION_BATCH_SIZE,
  ACTIVITY_RETENTION_MAX_BATCHES_PER_SCOPE,
  DEFAULT_ACTIVITY_POLICY,
} from '../constants/activity.constants';
import { ActivityRetentionRepository } from '../repositories/activity-retention.repository';

type RetentionScope = {
  organizationId: number | null;
  activityRetentionDays: number;
  failedLoginRetentionDays: number;
};

export type ActivityRetentionResult = {
  startedAt: Date;
  completedAt: Date;
  scopesProcessed: number;
  deleted: {
    authenticationAttempts: number;
    userSessions: number;
    resourceSessions: number;
    activityEvents: number;
  };
  batchLimitReached: boolean;
};

@Injectable()
export class ActivityRetentionService {
  constructor(
    private readonly activityRetentionRepository: ActivityRetentionRepository,
  ) {}

  async enforceRetention(now = new Date()): Promise<ActivityRetentionResult> {
    const startedAt = new Date();
    const policies =
      await this.activityRetentionRepository.findOrganizationPolicies();
    const scopes: RetentionScope[] = [
      ...policies.map(({ id, activityPolicy }) => ({
        organizationId: id,
        activityRetentionDays:
          activityPolicy?.activityRetentionDays ??
          DEFAULT_ACTIVITY_POLICY.activityRetentionDays,
        failedLoginRetentionDays:
          activityPolicy?.failedLoginRetentionDays ??
          DEFAULT_ACTIVITY_POLICY.failedLoginRetentionDays,
      })),
      {
        organizationId: null,
        activityRetentionDays: DEFAULT_ACTIVITY_POLICY.activityRetentionDays,
        failedLoginRetentionDays:
          DEFAULT_ACTIVITY_POLICY.failedLoginRetentionDays,
      },
    ];
    const deleted = {
      authenticationAttempts: 0,
      userSessions: 0,
      resourceSessions: 0,
      activityEvents: 0,
    };
    let batchLimitReached = false;

    for (const scope of scopes) {
      const cutoffs = {
        organizationId: scope.organizationId,
        activityCutoff: this.subtractDays(now, scope.activityRetentionDays),
        failedLoginCutoff: this.subtractDays(
          now,
          scope.failedLoginRetentionDays,
        ),
      };

      const events = await this.deleteAllBatches((take) =>
        this.activityRetentionRepository.deleteExpiredActivityEvents(
          cutoffs,
          take,
        ),
      );
      deleted.activityEvents += events.deleted;
      batchLimitReached ||= events.batchLimitReached;

      const resources = await this.deleteAllBatches((take) =>
        this.activityRetentionRepository.deleteExpiredResourceSessions(
          cutoffs,
          take,
        ),
      );
      deleted.resourceSessions += resources.deleted;
      batchLimitReached ||= resources.batchLimitReached;

      const sessions = await this.deleteAllBatches((take) =>
        this.activityRetentionRepository.deleteExpiredUserSessions(
          cutoffs,
          take,
        ),
      );
      deleted.userSessions += sessions.deleted;
      batchLimitReached ||= sessions.batchLimitReached;

      const attempts = await this.deleteAllBatches((take) =>
        this.activityRetentionRepository.deleteExpiredAuthenticationAttempts(
          cutoffs,
          take,
        ),
      );
      deleted.authenticationAttempts += attempts.deleted;
      batchLimitReached ||= attempts.batchLimitReached;
    }

    return {
      startedAt,
      completedAt: new Date(),
      scopesProcessed: scopes.length,
      deleted,
      batchLimitReached,
    };
  }

  private async deleteAllBatches(operation: (take: number) => Promise<number>) {
    let deleted = 0;

    for (
      let batch = 0;
      batch < ACTIVITY_RETENTION_MAX_BATCHES_PER_SCOPE;
      batch += 1
    ) {
      const batchDeleted = await operation(ACTIVITY_RETENTION_BATCH_SIZE);
      deleted += batchDeleted;
      if (batchDeleted < ACTIVITY_RETENTION_BATCH_SIZE) {
        return { deleted, batchLimitReached: false };
      }
    }

    return { deleted, batchLimitReached: true };
  }

  private subtractDays(date: Date, days: number) {
    const safeDays = Math.max(1, Math.floor(days));
    return new Date(date.getTime() - safeDays * 86_400_000);
  }
}
