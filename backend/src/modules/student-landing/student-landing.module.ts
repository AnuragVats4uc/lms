import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { ActivityModule } from '../activity/activity.module';
import { StudentLandingController } from './student-landing.controller';
import { StudentLandingService } from './student-landing.service';

@Module({
  imports: [PrismaModule, ActivityModule],
  controllers: [StudentLandingController],
  providers: [StudentLandingService],
})
export class StudentLandingModule {}
