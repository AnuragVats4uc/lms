import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { ActivityController } from './controllers/activity.controller';
import { ActivityReportController } from './controllers/activity-report.controller';
import { ActivityReportRepository } from './repositories/activity-report.repository';
import { ActivityRetentionRepository } from './repositories/activity-retention.repository';
import { ActivityRepository } from './repositories/activity.repository';
import { ActivityReportService } from './services/activity-report.service';
import { ActivityFinalizerService } from './services/activity-finalizer.service';
import { ActivityRetentionService } from './services/activity-retention.service';
import { ActivityRetentionWorkerService } from './services/activity-retention-worker.service';
import { ActivityService } from './services/activity.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityController, ActivityReportController],
  providers: [
    ActivityRepository,
    ActivityReportRepository,
    ActivityRetentionRepository,
    ActivityService,
    ActivityReportService,
    ActivityFinalizerService,
    ActivityRetentionService,
    ActivityRetentionWorkerService,
  ],
  exports: [ActivityRepository, ActivityService, ActivityRetentionService],
})
export class ActivityModule {}
