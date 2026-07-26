import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { PermissionQueryDto } from '../dto/permission-query.dto';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  @Permissions('permissions.create')
  @ApiOperation({ summary: 'Create permission' })
  @ApiCreatedResponse({
    description: 'Permission created successfully',
  })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @Permissions('permissions.read')
  @ApiOperation({ summary: 'Get paginated permission list' })
  @ApiOkResponse({
    description: 'Permission list fetched successfully',
  })
  findAll(@Query() query: PermissionQueryDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @Permissions('permissions.read')
  @ApiOperation({ summary: 'Get permission details' })
  @ApiOkResponse({
    description: 'Permission details fetched successfully',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }
}
