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

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionQueryDto } from '../dto/session-query.dto';
import {
  SessionListResponseDto,
  SessionResponseDto,
} from '../dto/session-response.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';
import { SessionService } from '../services/session.service';

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('organizations/:organizationId/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @Permissions('session.create')
  @ApiOperation({ summary: 'Create organization session' })
  @ApiParam({
    name: 'organizationId',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiCreatedResponse({
    description: 'Session created successfully',
    type: SessionResponseDto,
  })
  @ApiConflictResponse({
    description: 'Session name already exists in this organization',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  create(
    @Param('organizationId', ParseIntPipe)
    organizationId: number,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionService.create(organizationId, dto);
  }

  @Get()
  @Permissions('session.read')
  @ApiOperation({ summary: 'Get paginated session list' })
  @ApiParam({
    name: 'organizationId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Session list fetched successfully',
    type: SessionListResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  findAll(
    @Param('organizationId', ParseIntPipe)
    organizationId: number,
    @Query() query: SessionQueryDto,
  ) {
    return this.sessionService.findAll(organizationId, query);
  }

  @Get(':sessionId')
  @Permissions('session.read')
  @ApiOperation({ summary: 'Get session details' })
  @ApiParam({
    name: 'organizationId',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Session details fetched successfully',
    type: SessionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization or session not found',
  })
  findOne(
    @Param('organizationId', ParseIntPipe)
    organizationId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.sessionService.findOne(organizationId, sessionId);
  }

  @Patch(':sessionId')
  @Permissions('session.update')
  @ApiOperation({ summary: 'Update session' })
  @ApiParam({
    name: 'organizationId',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateSessionDto })
  @ApiOkResponse({
    description: 'Session updated successfully',
    type: SessionResponseDto,
  })
  @ApiConflictResponse({
    description: 'Session name already exists in this organization',
  })
  @ApiNotFoundResponse({
    description: 'Organization or session not found',
  })
  update(
    @Param('organizationId', ParseIntPipe)
    organizationId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionService.update(organizationId, sessionId, dto);
  }

  @Delete(':sessionId')
  @Permissions('session.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete session' })
  @ApiParam({
    name: 'organizationId',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Session soft deleted successfully',
    type: SessionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization or session not found',
  })
  remove(
    @Param('organizationId', ParseIntPipe)
    organizationId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.sessionService.remove(organizationId, sessionId);
  }
}
