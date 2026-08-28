import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Roles } from '../../auth/roles/roles.decorator';
import { CurrentUser } from '../../auth/types/current-user.types';
import {
  SaveStudentExamAnswerDto,
  UpdateStudentExamProgressDto,
} from '../dto/student-exam.dto';
import { StudentExamService } from '../services/student-exam.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Student exams')
@ApiBearerAuth('access-token')
@Roles('STUDENT')
@Controller('students/me')
export class StudentExamController {
  constructor(private readonly service: StudentExamService) {}

  @Post('resources/:resourceId/exam/start')
  start(
    @Req() request: AuthenticatedRequest,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.service.start(request.user, resourceId);
  }

  @Get('exam-attempts/:attemptUuid')
  getAttempt(
    @Req() request: AuthenticatedRequest,
    @Param('attemptUuid') attemptUuid: string,
  ) {
    return this.service.getAttempt(request.user, attemptUuid);
  }

  @Patch('exam-attempts/:attemptUuid/answers/:attemptQuestionId')
  saveAnswer(
    @Req() request: AuthenticatedRequest,
    @Param('attemptUuid') attemptUuid: string,
    @Param('attemptQuestionId', ParseIntPipe) attemptQuestionId: number,
    @Body() dto: SaveStudentExamAnswerDto,
  ) {
    return this.service.saveAnswer(
      request.user,
      attemptUuid,
      attemptQuestionId,
      dto,
    );
  }

  @Patch('exam-attempts/:attemptUuid/progress')
  updateProgress(
    @Req() request: AuthenticatedRequest,
    @Param('attemptUuid') attemptUuid: string,
    @Body() dto: UpdateStudentExamProgressDto,
  ) {
    return this.service.updateProgress(request.user, attemptUuid, dto);
  }

  @Post('exam-attempts/:attemptUuid/submit')
  submit(
    @Req() request: AuthenticatedRequest,
    @Param('attemptUuid') attemptUuid: string,
  ) {
    return this.service.submit(request.user, attemptUuid);
  }

  @Post('exam-attempts/:attemptUuid/continue-after-timeout')
  continueAfterTimeout(
    @Req() request: AuthenticatedRequest,
    @Param('attemptUuid') attemptUuid: string,
  ) {
    return this.service.continueAfterTimeout(request.user, attemptUuid);
  }

  @Get('exam-attempts/:attemptUuid/report')
  report(
    @Req() request: AuthenticatedRequest,
    @Param('attemptUuid') attemptUuid: string,
  ) {
    return this.service.getReport(request.user, attemptUuid);
  }
}
