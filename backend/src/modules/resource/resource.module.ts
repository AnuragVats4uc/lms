import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { ResourceController } from './controllers/resource.controller';
import { ResourceTypeController } from './controllers/resource-type.controller';
import { ResourceRepository } from './repositories/resource.repository';
import { ResourceService } from './services/resource.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResourceController, ResourceTypeController],
  providers: [ResourceService, ResourceRepository],
  exports: [ResourceService, ResourceRepository],
})
export class ResourceModule {}
