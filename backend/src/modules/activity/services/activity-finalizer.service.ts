import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ACTIVITY_FINALIZER_INTERVAL_MS } from '../constants/activity.constants';
import { ActivityService } from './activity.service';

@Injectable()
export class ActivityFinalizerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActivityFinalizerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly activityService: ActivityService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.finalize();
    }, ACTIVITY_FINALIZER_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async finalize() {
    if (this.running) return;
    this.running = true;

    try {
      const result = await this.activityService.finalizeStaleSessions();
      if (
        result.finalizedUserSessions > 0 ||
        result.finalizedResourceSessions > 0
      ) {
        this.logger.log(
          `Finalized ${result.finalizedUserSessions} user sessions and ${result.finalizedResourceSessions} resource sessions`,
        );
      }
    } catch (error) {
      this.logger.error('Unable to finalize stale activity sessions', error);
    } finally {
      this.running = false;
    }
  }
}
