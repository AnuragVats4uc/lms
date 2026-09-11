import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Permissions } from '../auth/permissions/permissions.decorator';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/types/current-user.types';
import {
  CreateDashboardBannerDto,
  DashboardBannerEventDto,
  DashboardBannerQueryDto,
  ReorderDashboardBannersDto,
  UpdateDashboardBannerDto,
} from './dto/student-dashboard-banner.dto';
import { StudentDashboardBannerService } from './student-dashboard-banner.service';

type AuthenticatedRequest = Request & { user: CurrentUser };
type UploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@ApiTags('Student dashboard banners')
@ApiBearerAuth('access-token')
@Controller('student-dashboard-banners')
export class StudentDashboardBannerController {
  constructor(private readonly service: StudentDashboardBannerService) {}

  @Get('admin')
  @Permissions('dashboard-banners.read')
  listAdmin(
    @Req() req: AuthenticatedRequest,
    @Query() query: DashboardBannerQueryDto,
  ) {
    return this.service.listAdmin(
      req.user,
      query.organizationId,
      query.sessionId,
    );
  }

  @Post('admin')
  @Permissions('dashboard-banners.create')
  create(
    @Req() req: AuthenticatedRequest,
    @Query() query: DashboardBannerQueryDto,
    @Body() dto: CreateDashboardBannerDto,
  ) {
    return this.service.create(req.user, query.organizationId, dto);
  }

  @Patch('admin/reorder')
  @Permissions('dashboard-banners.update')
  reorder(
    @Req() req: AuthenticatedRequest,
    @Query() query: DashboardBannerQueryDto,
    @Body() dto: ReorderDashboardBannersDto,
  ) {
    return this.service.reorder(
      req.user,
      query.organizationId,
      query.sessionId,
      dto.bannerIds,
    );
  }

  @Patch('admin/:id')
  @Permissions('dashboard-banners.update')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDashboardBannerDto,
  ) {
    return this.service.update(req.user, id, dto);
  }

  @Delete('admin/:id')
  @Permissions('dashboard-banners.delete')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(req.user, id);
  }

  @Post('admin/:id/:kind')
  @Permissions('dashboard-banners.update')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 12 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  upload(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('kind') kind: 'media' | 'poster',
    @UploadedFile() file?: UploadFile,
  ) {
    return this.service.uploadImage(req.user, id, kind, file);
  }

  @Get('media/:objectId/:objectUuid')
  async media(
    @Req() request: AuthenticatedRequest,
    @Param('objectId', ParseIntPipe) objectId: number,
    @Param('objectUuid', ParseUUIDPipe) objectUuid: string,
  ) {
    const file = await this.service.getImage(
      request.user,
      objectId,
      objectUuid,
    );
    return new StreamableFile(file.content, {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName.replace(/["\\]/g, '')}"`,
    });
  }

  @Post('student/:bannerUuid/event')
  @Roles('STUDENT')
  recordEvent(
    @Req() req: AuthenticatedRequest,
    @Param('bannerUuid', ParseUUIDPipe) bannerUuid: string,
    @Body() dto: DashboardBannerEventDto,
  ) {
    return this.service.recordEvent(req.user, bannerUuid, dto);
  }
}
