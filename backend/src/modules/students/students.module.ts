import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RolesModule } from '../roles/roles.module';
import { ResourceModule } from '../resource/resource.module';
import { StudentsController } from './controllers/students.controller';
import { StudentsRepository } from './repositories/students.repository';
import { StudentsService } from './services/students.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [AuthModule, RolesModule, ResourceModule, ActivityModule],
  controllers: [StudentsController],
  providers: [StudentsRepository, StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
