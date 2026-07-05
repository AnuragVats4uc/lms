import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { StudentsService } from './students.service';
import { StudentsRepository } from './students.repository';
import { StudentsController } from './students.controller';

@Module({
  imports: [PrismaModule],

  controllers:[StudentsController],
  providers: [
    StudentsService,
    StudentsRepository,
  ],

  exports: [
    StudentsService,
    StudentsRepository,
  ],
})
export class StudentsModule {}