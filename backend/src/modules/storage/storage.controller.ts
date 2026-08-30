import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorators';
import { ManagedObjectService } from './managed-object.service';

@ApiTags('Health')
@Controller('health/storage')
export class StorageController {
  constructor(private readonly managedObjects: ManagedObjectService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check managed object storage readiness' })
  check() {
    return this.managedObjects.health();
  }
}
