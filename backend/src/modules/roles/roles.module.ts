import { Module } from '@nestjs/common';

import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaModule } from '../../prisma';
import { RolesController } from './controllers/roles.controller';
import { RolesRepository } from './repositories/roles.repository';
import { RolesService } from './services/roles.service';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  exports: [RolesService, RolesRepository],
})
export class RolesModule {}
