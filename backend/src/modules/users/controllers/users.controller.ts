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
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CurrentUser } from '../../auth/types/current-user.types';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user-query.dto';
import { UsersService } from '../services/users.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users.create')
  @ApiOperation({ summary: 'Create organization user' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'User created successfully' })
  create(@Body() dto: CreateUserDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.create(dto, request.user);
  }

  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get paginated user list' })
  @ApiOkResponse({ description: 'User list fetched successfully' })
  findAll(@Query() query: UserQueryDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.findAll(query, request.user);
  }

  @Get(':id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get user details' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'User details fetched successfully' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.findOne(id, request.user);
  }

  @Patch(':id')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Update organization user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'User updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.update(id, dto, request.user);
  }

  @Delete(':id')
  @Permissions('users.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete organization user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'User soft deleted successfully' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.remove(id, request.user);
  }
}
