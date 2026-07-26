import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto';
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RoleQueryDto } from '../dto/role-query.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesService } from '../services/roles.service';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create role' })
  @ApiCreatedResponse({ description: 'Role created successfully' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get paginated role list' })
  @ApiOkResponse({ description: 'Role list fetched successfully' })
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get role details' })
  @ApiOkResponse({ description: 'Role details fetched successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Update role' })
  @ApiOkResponse({ description: 'Role updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
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
  ) {
    return this.rolesService.assignPermissions(id, dto);
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
  ) {
    return this.rolesService.assignToUser(id, dto);
  }
}
