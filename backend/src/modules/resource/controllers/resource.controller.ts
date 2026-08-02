import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceQueryDto } from '../dto/resource-query.dto';
import {
  ResourceListResponseDto,
  ResourceResponseDto,
} from '../dto/resource-response.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { ResourceService } from '../services/resource.service';

@ApiTags('Resources')
@ApiBearerAuth('access-token')
@Controller('folders/:folderId/resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  @Permissions('resource.create')
  @ApiOperation({ summary: 'Create a learning resource in a folder' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiBody({ type: CreateResourceDto })
  @ApiCreatedResponse({
    description: 'Resource created successfully',
    type: ResourceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Resource type and type-specific fields are invalid',
  })
  @ApiNotFoundResponse({ description: 'Folder not found' })
  create(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourceService.create(folderId, dto);
  }

  @Get()
  @Permissions('resource.read')
  @ApiOperation({ summary: 'Get paginated resources in a folder' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Resource list fetched successfully',
    type: ResourceListResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Folder not found' })
  findAll(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Query() query: ResourceQueryDto,
  ) {
    return this.resourceService.findAll(folderId, query);
  }

  @Get(':resourceId')
  @Permissions('resource.read')
  @ApiOperation({ summary: 'Get resource details' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Resource details fetched successfully',
    type: ResourceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Folder or resource not found' })
  findOne(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.resourceService.findOne(folderId, resourceId);
  }

  @Patch(':resourceId')
  @Permissions('resource.update')
  @ApiOperation({ summary: 'Update a learning resource' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiBody({ type: UpdateResourceDto })
  @ApiOkResponse({
    description: 'Resource updated successfully',
    type: ResourceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Resource type and type-specific fields are invalid',
  })
  @ApiNotFoundResponse({ description: 'Folder or resource not found' })
  update(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourceService.update(folderId, resourceId, dto);
  }

  @Delete(':resourceId')
  @Permissions('resource.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a learning resource' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Resource soft deleted successfully',
    type: ResourceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Folder or resource not found' })
  remove(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.resourceService.remove(folderId, resourceId);
  }
}
