import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { TeacherDashboardController } from './teacher-dashboard.controller';
import { TeacherDashboardRepository } from './teacher-dashboard.repository';
import { TeacherDashboardService } from './teacher-dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherDashboardController],
  providers: [TeacherDashboardService, TeacherDashboardRepository],
})
export class TeacherModule {}
