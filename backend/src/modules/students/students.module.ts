import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RolesModule } from '../roles/roles.module';
import { ResourceModule } from '../resource/resource.module';
import { StudentsController } from './controllers/students.controller';
import { StudentsRepository } from './repositories/students.repository';
import { StudentsService } from './services/students.service';

@Module({
  imports: [AuthModule, RolesModule, ResourceModule],
  controllers: [StudentsController],
  providers: [StudentsRepository, StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
