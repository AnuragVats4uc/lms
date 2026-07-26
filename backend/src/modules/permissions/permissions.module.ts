import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { PermissionsController } from './controllers/permissions.controller';
import { PermissionsRepository } from './repositories/permissions.repository';
import { PermissionsService } from './services/permissions.service';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository],
  exports: [PermissionsService, PermissionsRepository],
})
export class PermissionsModule {}
