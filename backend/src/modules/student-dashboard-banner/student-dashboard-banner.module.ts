import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { StudentDashboardBannerController } from './student-dashboard-banner.controller';
import { StudentDashboardBannerService } from './student-dashboard-banner.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentDashboardBannerController],
  providers: [StudentDashboardBannerService],
  exports: [StudentDashboardBannerService],
})
export class StudentDashboardBannerModule {}
