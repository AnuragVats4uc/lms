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
  StreamableFile,
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
import { Request } from 'express';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { Roles } from '../../auth/roles/roles.decorator';
import { CurrentUser } from '../../auth/types/current-user.types';
import { CreateStudentDto } from '../dto/create-student.dto';
import { StudentDashboardResponseDto } from '../dto/student-dashboard-response.dto';
import { StudentCoursesQueryDto } from '../dto/student-courses-query.dto';
import { StudentCoursesResponseDto } from '../dto/student-courses-response.dto';
import { StudentResourcesQueryDto } from '../dto/student-resources-query.dto';
import { StudentResourcesResponseDto } from '../dto/student-resources-response.dto';
import { StudentResourceDetailResponseDto } from '../dto/student-resource-detail-response.dto';
import { StudentVideoResourceResponseDto } from '../dto/student-video-resource-response.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { UpdateStudentVideoProgressDto } from '../dto/update-student-video-progress.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { StudentsService } from '../services/students.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Students')
@ApiBearerAuth('access-token')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Permissions('students.create')
  @ApiOperation({ summary: 'Create student user' })
  @ApiBody({ type: CreateStudentDto })
  @ApiCreatedResponse({ description: 'Student created successfully' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get paginated student list' })
  @ApiOkResponse({ description: 'Student list fetched successfully' })
  findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get('me/dashboard')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get authenticated student dashboard data' })
  @ApiOkResponse({
    description: 'Student dashboard fetched successfully',
    type: StudentDashboardResponseDto,
  })
  getMyDashboard(@Req() request: AuthenticatedRequest) {
    return this.studentsService.getMyDashboard(request.user);
  }

  @Get('me/courses')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get authenticated student assigned courses' })
  @ApiOkResponse({
    description: 'Student courses fetched successfully',
    type: StudentCoursesResponseDto,
  })
  getMyCourses(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentCoursesQueryDto,
  ) {
    return this.studentsService.getMyCourses(request.user, query);
  }

  @Get('me/resources')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get authenticated student learning resources' })
  @ApiOkResponse({
    description: 'Student resources fetched successfully',
    type: StudentResourcesResponseDto,
  })
  getMyResources(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentResourcesQueryDto,
  ) {
    return this.studentsService.getMyResources(request.user, query);
  }

  @Get('me/resources/:resourceId/video')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get an authorized student video lesson' })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Student video lesson fetched successfully',
    type: StudentVideoResourceResponseDto,
  })
  getMyVideoResource(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.studentsService.getMyVideoResource(request.user, resourceId);
  }

  @Patch('me/resources/:resourceId/video/progress')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Save student video playback progress' })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiBody({ type: UpdateStudentVideoProgressDto })
  @ApiOkResponse({ description: 'Video playback progress saved successfully' })
  updateMyVideoProgress(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Body() dto: UpdateStudentVideoProgressDto,
  ) {
    return this.studentsService.updateMyVideoProgress(
      request.user,
      resourceId,
      dto,
    );
  }

  @Get('me/resources/:resourceId/file')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Stream an authorized student document file' })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Document file streamed successfully' })
  async getMyDocumentFile(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    const file = await this.studentsService.getMyDocumentFile(
      request.user,
      resourceId,
    );

    const safeAsciiFileName = file.fileName
      .normalize('NFKD')
      .replace(/[^\x20-\x7e]/g, '-')
      .replace(/["\\]/g, '');
    const options = {
      type: file.mimeType,
      disposition: `inline; filename="${safeAsciiFileName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    };

    return Buffer.isBuffer(file.content)
      ? new StreamableFile(file.content, options)
      : new StreamableFile(file.content, options);
  }

  @Post('me/resources/:resourceId/access')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a student document access' })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Document access recorded successfully' })
  recordMyResourceAccess(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.studentsService.recordMyResourceAccess(
      request.user,
      resourceId,
    );
  }

  @Get('me/resources/:resourceId')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get an authorized student document' })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Student document fetched successfully',
    type: StudentResourceDetailResponseDto,
  })
  getMyResource(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.studentsService.getMyResource(request.user, resourceId);
  }

  @Get('me')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get authenticated student account and profile' })
  @ApiOkResponse({ description: 'Student account fetched successfully' })
  getMe(@Req() request: AuthenticatedRequest) {
    return this.studentsService.getMe(request.user);
  }

  @Get(':id')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get student details' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Student details fetched successfully' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('students.update')
  @ApiOperation({ summary: 'Update student user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateStudentDto })
  @ApiOkResponse({ description: 'Student updated successfully' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('students.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete student user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Student soft deleted successfully' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
