import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { CurrentUser } from '../../auth/types/current-user.types';
import { ActivityHeartbeatDto } from '../dto/activity-heartbeat.dto';
import {
  ActivityPolicyResponseDto,
  UserActivityHeartbeatResponseDto,
} from '../dto/activity-policy-response.dto';
import { ActivityService } from '../services/activity.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Activity')
@ApiBearerAuth('access-token')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('policy')
  @ApiOperation({
    summary: 'Get activity tracking policy for the current user',
  })
  @ApiOkResponse({ type: ActivityPolicyResponseDto })
  getPolicy(@Req() request: AuthenticatedRequest) {
    return this.activityService.getPolicy(request.user);
  }

  @Post('sessions/:sessionUuid/heartbeat')
  @ApiOperation({ summary: 'Heartbeat the current user activity session' })
  @ApiOkResponse({ type: UserActivityHeartbeatResponseDto })
  heartbeatUserSession(
    @Req() request: AuthenticatedRequest,
    @Param('sessionUuid', new ParseUUIDPipe()) sessionUuid: string,
    @Body() body: ActivityHeartbeatDto,
  ) {
    return this.activityService.heartbeatUserSession(
      sessionUuid,
      request.user.userId,
      body.active,
    );
  }
}
