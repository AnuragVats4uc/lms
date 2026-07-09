import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { StudentsModule } from '../students/students.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DenyImpersonationGuard } from './guards/deny-impersonation.guard';
import { AdminImpersonationController } from './admin-impersonation.controller';
import { AdminImpersonationRepository } from './admin-impersonation.repository';
import { AdminImpersonationService } from './admin-impersonation.service';

@Module({
  imports: [JwtModule, StudentsModule],
  controllers: [AdminImpersonationController],
  providers: [
    AdminImpersonationRepository,
    AdminImpersonationService,
    DenyImpersonationGuard,
    RolesGuard,
  ],
  exports: [
    AdminImpersonationService,
    DenyImpersonationGuard,
  ],
})
export class AdminImpersonationModule {}
