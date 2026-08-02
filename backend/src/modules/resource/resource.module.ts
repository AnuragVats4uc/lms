import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { ResourceController } from './controllers/resource.controller';
import { ResourceRepository } from './repositories/resource.repository';
import { ResourceService } from './services/resource.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResourceController],
  providers: [ResourceService, ResourceRepository],
  exports: [ResourceService, ResourceRepository],
})
export class ResourceModule {}
