import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ACTIVITY_RETENTION_INITIAL_DELAY_MS,
  ACTIVITY_RETENTION_INTERVAL_MS,
} from '../constants/activity.constants';
import { ActivityRetentionService } from './activity-retention.service';

@Injectable()
export class ActivityRetentionWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ActivityRetentionWorkerService.name);
  private timer?: NodeJS.Timeout;
  private destroyed = false;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(ActivityRetentionService)
    private readonly activityRetentionService: ActivityRetentionService,
  ) {}

  onModuleInit() {
    const enabled = this.configService.get<boolean>(
      'activity.retentionWorkerEnabled',
      true,
    );
    if (!enabled) {
      this.logger.log('Activity retention worker is disabled');
      return;
    }

    this.schedule(ACTIVITY_RETENTION_INITIAL_DELAY_MS);
  }

  onModuleDestroy() {
    this.destroyed = true;
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(delay: number) {
    this.timer = setTimeout(() => {
      void this.runAndReschedule();
    }, delay);
    this.timer.unref();
  }

  private async runAndReschedule() {
    try {
      const result = await this.activityRetentionService.enforceRetention();
      const totalDeleted = Object.values(result.deleted).reduce(
        (total, count) => total + count,
        0,
      );
      this.logger.log(
        `Activity retention completed for ${result.scopesProcessed} scopes; deleted ${totalDeleted} records`,
      );
      if (result.batchLimitReached) {
        this.logger.warn(
          'Activity retention reached its per-scope batch limit; remaining records will be processed on the next run',
        );
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Unable to enforce activity retention', stack);
    } finally {
      if (!this.destroyed) this.schedule(ACTIVITY_RETENTION_INTERVAL_MS);
    }
  }
}
