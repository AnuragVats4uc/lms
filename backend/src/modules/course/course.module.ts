import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { CourseController } from './controllers/course.controller';
import { CourseRepository } from './repositories/course.repository';
import { CourseService } from './services/course.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository],
  exports: [CourseService, CourseRepository],
})
export class CourseModule {}
