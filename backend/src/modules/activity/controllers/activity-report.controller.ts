import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Roles } from '../../auth/roles/roles.decorator';
import { CurrentUser } from '../../auth/types/current-user.types';
import {
  StudentActivityReportExportQueryDto,
  StudentActivityReportQueryDto,
} from '../dto/student-activity-report.dto';
import { ActivityReportService } from '../services/activity-report.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Student activity reports')
@ApiBearerAuth('access-token')
@Controller('reports/students')
@Roles('ADMIN', 'COUNSELOR', 'TEACHER')
export class ActivityReportController {
  constructor(private readonly activityReportService: ActivityReportService) {}

  @Get(':studentUuid/activity')
  @ApiOperation({ summary: 'Get a student-specific activity report' })
  @ApiOkResponse({
    description: 'Student activity report fetched successfully',
  })
  getStudentReport(
    @Req() request: AuthenticatedRequest,
    @Param('studentUuid', new ParseUUIDPipe()) studentUuid: string,
    @Query() query: StudentActivityReportQueryDto,
  ) {
    return this.activityReportService.getStudentReport(
      request.user,
      studentUuid,
      query,
    );
  }

  @Get(':studentUuid/activity/export')
  @ApiOperation({ summary: 'Export a student activity report as CSV or XLSX' })
  @ApiOkResponse({ description: 'Student activity report export' })
  async exportStudentReport(
    @Req() request: AuthenticatedRequest,
    @Param('studentUuid', new ParseUUIDPipe()) studentUuid: string,
    @Query() query: StudentActivityReportExportQueryDto,
  ) {
    const result = await this.activityReportService.exportStudentReport(
      request.user,
      studentUuid,
      query,
    );
    return new StreamableFile(result.buffer, {
      type: result.contentType,
      disposition: `attachment; filename="${result.filename}"`,
      length: result.buffer.length,
    });
  }
}
