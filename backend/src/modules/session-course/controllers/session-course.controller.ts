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
import { CreateSessionCourseDto } from '../dto/create-session-course.dto';
import { SessionCourseQueryDto } from '../dto/session-course-query.dto';
import {
  SessionCourseListResponseDto,
  SessionCourseResponseDto,
} from '../dto/session-course-response.dto';
import { UpdateSessionCourseDto } from '../dto/update-session-course.dto';
import { SessionCourseService } from '../services/session-course.service';

@ApiTags('Session Courses')
@ApiBearerAuth('access-token')
@Controller('sessions/:sessionId/courses')
export class SessionCourseController {
  constructor(private readonly sessionCourseService: SessionCourseService) {}

  @Post()
  @Permissions('session-course.create')
  @ApiOperation({ summary: 'Assign course to session' })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: CreateSessionCourseDto })
  @ApiCreatedResponse({
    description: 'Course assigned to session successfully',
    type: SessionCourseResponseDto,
  })
  @ApiConflictResponse({
    description: 'Course already assigned to this session',
  })
  @ApiNotFoundResponse({
    description: 'Session or course not found',
  })
  create(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: CreateSessionCourseDto,
  ) {
    return this.sessionCourseService.create(sessionId, dto);
  }

  @Get()
  @Permissions('session-course.read')
  @ApiOperation({ summary: 'Get paginated session course list' })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Session course list fetched successfully',
    type: SessionCourseListResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Session not found',
  })
  findAll(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query() query: SessionCourseQueryDto,
  ) {
    return this.sessionCourseService.findAll(sessionId, query);
  }

  @Get(':sessionCourseId')
  @Permissions('session-course.read')
  @ApiOperation({ summary: 'Get session course details' })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'sessionCourseId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Session course details fetched successfully',
    type: SessionCourseResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Session or session course not found',
  })
  findOne(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
  ) {
    return this.sessionCourseService.findOne(sessionId, sessionCourseId);
  }

  @Patch(':sessionCourseId')
  @Permissions('session-course.update')
  @ApiOperation({ summary: 'Update session course' })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'sessionCourseId',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateSessionCourseDto })
  @ApiOkResponse({
    description: 'Session course updated successfully',
    type: SessionCourseResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Session or session course not found',
  })
  update(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
    @Body() dto: UpdateSessionCourseDto,
  ) {
    return this.sessionCourseService.update(sessionId, sessionCourseId, dto);
  }

  @Delete(':sessionCourseId')
  @Permissions('session-course.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete session course assignment' })
  @ApiParam({
    name: 'sessionId',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'sessionCourseId',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Session course assignment soft deleted successfully',
    type: SessionCourseResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Session or session course not found',
  })
  remove(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
  ) {
    return this.sessionCourseService.remove(sessionId, sessionCourseId);
  }
}
