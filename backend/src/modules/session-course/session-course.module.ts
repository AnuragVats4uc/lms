import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { SessionCourseController } from './controllers/session-course.controller';
import { SessionCourseRepository } from './repositories/session-course.repository';
import { SessionCourseService } from './services/session-course.service';

@Module({
  imports: [PrismaModule],
  controllers: [SessionCourseController],
  providers: [SessionCourseService, SessionCourseRepository],
  exports: [SessionCourseService, SessionCourseRepository],
})
export class SessionCourseModule {}
