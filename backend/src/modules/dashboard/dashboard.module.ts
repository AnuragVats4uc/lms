import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardRepository } from './repositories/dashboard.repository';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
