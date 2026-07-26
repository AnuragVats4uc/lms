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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { OrganizationQueryDto } from '../dto/organization-query.dto';
import {
  OrganizationListResponseDto,
  OrganizationResponseDto,
} from '../dto/organization-response.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { OrganizationService } from '../services/organization.service';
import { Permissions } from '../../auth/permissions/permissions.decorator';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
  ) {}

  @Post()
  @Permissions('organizations.create')
  @ApiOperation({ summary: 'Create organization' })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiCreatedResponse({
    description: 'Organization created successfully',
    type: OrganizationResponseDto,
  })
  @ApiConflictResponse({
    description: 'Organization name or code already exists',
  })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
  }

  @Get()
  @Permissions('organizations.read')
  @ApiOperation({ summary: 'Get paginated organization list' })
  @ApiOkResponse({
    description: 'Organization list fetched successfully',
    type: OrganizationListResponseDto,
  })
  findAll(@Query() query: OrganizationQueryDto) {
    return this.organizationService.findAll(query);
  }

  @Get(':id')
  @Permissions('organizations.read')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Organization details fetched successfully',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @Permissions('organizations.update')
  @ApiOperation({ summary: 'Update organization' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiOkResponse({
    description: 'Organization updated successfully',
    type: OrganizationResponseDto,
  })
  @ApiConflictResponse({
    description: 'Organization name or code already exists',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('organizations.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete organization' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Organization soft deleted successfully',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.remove(id);
  }
}
