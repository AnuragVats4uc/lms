import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
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
import { ChangeMyPasswordDto } from '../dto/change-my-password.dto';
import { CreateStudentDto } from '../dto/create-student.dto';
import { StudentCalendarQueryDto } from '../dto/student-calendar-query.dto';
import { StudentNotificationsQueryDto } from '../dto/student-notifications-query.dto';
import { StudentDashboardResponseDto } from '../dto/student-dashboard-response.dto';
import { StudentCoursesQueryDto } from '../dto/student-courses-query.dto';
import { StudentCoursesResponseDto } from '../dto/student-courses-response.dto';
import { StudentCourseFoldersResponseDto } from '../dto/student-course-folders-response.dto';
import { StudentExamResourceResponseDto } from '../dto/student-exam-resource-response.dto';
import { StudentFolderResourcesQueryDto } from '../dto/student-folder-resources-query.dto';
import { StudentFolderResourcesResponseDto } from '../dto/student-folder-resources-response.dto';
import { StudentResourcesQueryDto } from '../dto/student-resources-query.dto';
import { StudentResourcesResponseDto } from '../dto/student-resources-response.dto';
import { StudentResourceDetailResponseDto } from '../dto/student-resource-detail-response.dto';
import { StudentVideoResourceResponseDto } from '../dto/student-video-resource-response.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { RecordStudentDocumentAccessDto } from '../dto/record-student-document-access.dto';
import { UpdateMyStudentPreferencesDto } from '../dto/update-my-student-preferences.dto';
import { UpdateMyStudentProfileDto } from '../dto/update-my-student-profile.dto';
import { UpdateStudentVideoProgressDto } from '../dto/update-student-video-progress.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { UpdateStudentNotificationDto } from '../dto/update-student-notification.dto';
import {
  StudentAvatarFile,
  StudentsService,
} from '../services/students.service';
import {
  DocumentPageActivityDto,
  EndResourceActivityDto,
  ResourceActivityEventDto,
  ResourceActivityHeartbeatDto,
  StartResourceActivityDto,
} from '../../activity/dto/resource-activity.dto';

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
  create(@Body() dto: CreateStudentDto, @Req() request: AuthenticatedRequest) {
    return this.studentsService.create(dto, request.user);
  }

  @Get()
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get paginated student list' })
  @ApiOkResponse({ description: 'Student list fetched successfully' })
  findAll(
    @Query() query: StudentQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentsService.findAll(query, request.user);
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

  @Get('me/calendar')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Get authenticated student exam and academic-session calendar',
  })
  @ApiOkResponse({
    description: 'Student calendar fetched successfully',
  })
  getMyCalendar(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentCalendarQueryDto,
  ) {
    return this.studentsService.getMyCalendar(request.user, query);
  }

  @Get('me/notifications')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get authenticated student notifications' })
  @ApiOkResponse({ description: 'Student notifications fetched successfully' })
  getMyNotifications(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentNotificationsQueryDto,
  ) {
    return this.studentsService.getMyNotifications(request.user, query);
  }

  @Get('me/notifications/unread-count')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Get authenticated student unread notification count',
  })
  @ApiOkResponse({
    description: 'Unread notification count fetched successfully',
  })
  getMyUnreadNotificationCount(@Req() request: AuthenticatedRequest) {
    return this.studentsService.getMyUnreadNotificationCount(request.user);
  }

  @Patch('me/notifications/read-all')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Mark all authenticated student notifications as read',
  })
  @ApiOkResponse({ description: 'Notifications marked as read' })
  markAllMyNotificationsRead(@Req() request: AuthenticatedRequest) {
    return this.studentsService.markAllMyNotificationsRead(request.user);
  }

  @Patch('me/notifications/:notificationUuid')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Update authenticated student notification state' })
  @ApiParam({ name: 'notificationUuid', format: 'uuid' })
  @ApiBody({ type: UpdateStudentNotificationDto })
  @ApiOkResponse({ description: 'Notification updated successfully' })
  updateMyNotification(
    @Req() request: AuthenticatedRequest,
    @Param('notificationUuid', ParseUUIDPipe) notificationUuid: string,
    @Body() dto: UpdateStudentNotificationDto,
  ) {
    return this.studentsService.updateMyNotification(
      request.user,
      notificationUuid,
      dto,
    );
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

  @Get('me/courses/:sessionCourseId/folders')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Get top-level folders for an assigned student course',
  })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Student course folders fetched successfully',
    type: StudentCourseFoldersResponseDto,
  })
  getMyCourseFolders(
    @Req() request: AuthenticatedRequest,
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
  ) {
    return this.studentsService.getMyCourseFolders(
      request.user,
      sessionCourseId,
    );
  }

  @Get('me/courses/:sessionCourseId/folders/:folderId/resources')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Get resources from an assigned top-level course folder',
  })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Student folder resources fetched successfully',
    type: StudentFolderResourcesResponseDto,
  })
  getMyFolderResources(
    @Req() request: AuthenticatedRequest,
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Query() query: StudentFolderResourcesQueryDto,
  ) {
    return this.studentsService.getMyFolderResources(
      request.user,
      sessionCourseId,
      folderId,
      query,
    );
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

  @Get('me/resources/:resourceId/exam')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get an authorized student exam resource' })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Student exam resource fetched successfully',
    type: StudentExamResourceResponseDto,
  })
  getMyExamResource(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.studentsService.getMyExamResource(request.user, resourceId);
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
    @Body() dto: RecordStudentDocumentAccessDto,
  ) {
    return this.studentsService.recordMyResourceAccess(
      request.user,
      resourceId,
      dto,
    );
  }

  @Post('me/resources/:resourceId/activity')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Start an authorized resource activity session' })
  startMyResourceActivity(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Body() dto: StartResourceActivityDto,
  ) {
    return this.studentsService.startMyResourceActivity(
      request.user,
      resourceId,
      dto,
    );
  }

  @Post('me/resource-activity/:sessionUuid/heartbeat')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Heartbeat an owned resource activity session' })
  heartbeatMyResourceActivity(
    @Req() request: AuthenticatedRequest,
    @Param('sessionUuid', new ParseUUIDPipe()) sessionUuid: string,
    @Body() dto: ResourceActivityHeartbeatDto,
  ) {
    return this.studentsService.heartbeatMyResourceActivity(
      request.user,
      sessionUuid,
      dto,
    );
  }

  @Post('me/resource-activity/:sessionUuid/pages')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a document page change' })
  switchMyDocumentPage(
    @Req() request: AuthenticatedRequest,
    @Param('sessionUuid', new ParseUUIDPipe()) sessionUuid: string,
    @Body() dto: DocumentPageActivityDto,
  ) {
    return this.studentsService.switchMyDocumentPage(
      request.user,
      sessionUuid,
      dto.pageNumber,
    );
  }

  @Post('me/resource-activity/:sessionUuid/events')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record an owned resource activity event' })
  recordMyResourceActivityEvent(
    @Req() request: AuthenticatedRequest,
    @Param('sessionUuid', new ParseUUIDPipe()) sessionUuid: string,
    @Body() dto: ResourceActivityEventDto,
  ) {
    return this.studentsService.recordMyResourceActivityEvent(
      request.user,
      sessionUuid,
      dto,
    );
  }

  @Post('me/resource-activity/:sessionUuid/end')
  @Roles('STUDENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End an owned resource activity session' })
  endMyResourceActivity(
    @Req() request: AuthenticatedRequest,
    @Param('sessionUuid', new ParseUUIDPipe()) sessionUuid: string,
    @Body() dto: EndResourceActivityDto,
  ) {
    return this.studentsService.endMyResourceActivity(
      request.user,
      sessionUuid,
      dto,
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

  @Get('me/profile')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get authenticated student profile workspace' })
  @ApiOkResponse({ description: 'Student profile fetched successfully' })
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.studentsService.getMyProfile(request.user);
  }

  @Patch('me/profile')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Update authenticated student editable profile' })
  @ApiBody({ type: UpdateMyStudentProfileDto })
  @ApiOkResponse({ description: 'Student profile updated successfully' })
  updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateMyStudentProfileDto,
  ) {
    return this.studentsService.updateMyProfile(request.user, dto);
  }

  @Post('me/profile/avatar')
  @Roles('STUDENT')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Upload authenticated student profile photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Profile photo uploaded successfully' })
  uploadMyAvatar(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: StudentAvatarFile | undefined,
  ) {
    return this.studentsService.uploadMyAvatar(request.user, file);
  }

  @Get('me/profile/avatar')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Stream authenticated student profile photo' })
  @ApiOkResponse({ description: 'Profile photo streamed successfully' })
  async getMyAvatar(@Req() request: AuthenticatedRequest) {
    const file = await this.studentsService.getMyAvatar(request.user);
    const safeName = file.fileName
      .normalize('NFKD')
      .replace(/[^\x20-\x7e]/g, '-')
      .replace(/["\\]/g, '');
    return new StreamableFile(file.content, {
      type: file.mimeType,
      disposition: `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    });
  }

  @Delete('me/profile/avatar')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Delete authenticated student profile photo' })
  @ApiOkResponse({ description: 'Profile photo deleted successfully' })
  deleteMyAvatar(@Req() request: AuthenticatedRequest) {
    return this.studentsService.deleteMyAvatar(request.user);
  }

  @Patch('me/preferences')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Update authenticated student preferences' })
  @ApiBody({ type: UpdateMyStudentPreferencesDto })
  @ApiOkResponse({ description: 'Student preferences updated successfully' })
  updateMyPreferences(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateMyStudentPreferencesDto,
  ) {
    return this.studentsService.updateMyPreferences(request.user, dto);
  }

  @Patch('me/password')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Change authenticated student password' })
  @ApiBody({ type: ChangeMyPasswordDto })
  @ApiOkResponse({ description: 'Student password changed successfully' })
  changeMyPassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    return this.studentsService.changeMyPassword(request.user, dto);
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
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentsService.findOne(id, request.user);
  }

  @Patch(':id')
  @Permissions('students.update')
  @ApiOperation({ summary: 'Update student user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateStudentDto })
  @ApiOkResponse({ description: 'Student updated successfully' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentsService.update(id, dto, request.user);
  }

  @Delete(':id')
  @Permissions('students.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete student user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Student soft deleted successfully' })
  @ApiNotFoundResponse({ description: 'Student not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentsService.remove(id, request.user);
  }
}
