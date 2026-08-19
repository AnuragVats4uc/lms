import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { ResourceTypeListResponseDto } from '../dto/resource-type-response.dto';
import { ResourceService } from '../services/resource.service';

@ApiTags('Resource Types')
@ApiBearerAuth('access-token')
@Controller('resource-types')
export class ResourceTypeController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  @Permissions('resource.read')
  @ApiOperation({ summary: 'Get active resource types' })
  @ApiOkResponse({ type: ResourceTypeListResponseDto })
  findAll() {
    return this.resourceService.findResourceTypes();
  }
}
