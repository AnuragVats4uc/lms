import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { StudentsService } from './students.service';
import { StudentsRepository } from './students.repository';

@Module({
  imports: [PrismaModule],

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