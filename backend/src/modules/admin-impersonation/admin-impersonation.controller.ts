import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentStudent } from '../auth/decorators/current-student.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StartImpersonationDto } from './dto/start-impersonation.dto';
import { AdminImpersonationService } from './admin-impersonation.service';
import type { AuthenticatedRequestUser } from './types/impersonation.types';

@Controller('admin')
export class AdminImpersonationController {
  constructor(
    private readonly impersonationService: AdminImpersonationService,
  ) {}

  @Post('students/:studentId/impersonate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'SUPPORT')
  start(
    @CurrentStudent() admin: AuthenticatedRequestUser,
    @Param('studentId') studentId: string,
    @Body() dto: StartImpersonationDto,
    @Req() request: Request,
  ) {
    return this.impersonationService.start(
      admin,
      studentId,
      dto,
      {
        ipAddress: this.getIpAddress(request),
        userAgent: request.headers['user-agent'],
      },
    );
  }

  @Post('impersonation/stop')
  stop(@CurrentStudent() user: AuthenticatedRequestUser) {
    return this.impersonationService.stop(user);
  }

  @Get('impersonation/current')
  current(@CurrentStudent() user: AuthenticatedRequestUser) {
    return this.impersonationService.current(user);
  }

  private getIpAddress(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0] ?? request.ip;
    }

    return forwardedFor?.split(',')[0]?.trim() || request.ip;
  }
}
