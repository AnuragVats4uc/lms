import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CurrentUser } from '../../auth/types/current-user.types';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto';
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RoleQueryDto } from '../dto/role-query.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesService } from '../services/roles.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create role' })
  @ApiCreatedResponse({ description: 'Role created successfully' })
  create(@Body() dto: CreateRoleDto, @Req() request: AuthenticatedRequest) {
    return this.rolesService.create(dto, request.user);
  }

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get paginated role list' })
  @ApiOkResponse({ description: 'Role list fetched successfully' })
  findAll(@Query() query: RoleQueryDto, @Req() request: AuthenticatedRequest) {
    return this.rolesService.findAll(query, request.user);
  }

  @Get(':id')
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get role details' })
  @ApiOkResponse({ description: 'Role details fetched successfully' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.rolesService.findOne(id, request.user);
  }

  @Patch(':id')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Update role' })
  @ApiOkResponse({ description: 'Role updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.rolesService.update(id, dto, request.user);
  }

  @Post(':id/permissions')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Assign permissions to role' })
  @ApiOkResponse({
    description: 'Role permissions updated successfully',
  })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRolePermissionsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.rolesService.assignPermissions(id, dto, request.user);
  }

  @Post(':id/users')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiOkResponse({
    description: 'Role assigned to user successfully',
  })
  assignToUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignUserRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.rolesService.assignToUser(id, dto, request.user);
  }
}
