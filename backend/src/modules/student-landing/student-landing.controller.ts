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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Public } from '../auth/decorators/public.decorators';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/types/current-user.types';
import {
  CreateStudentLandingCardDto,
  ReorderStudentLandingCardsDto,
  StudentLandingCardQueryDto,
  StudentLandingEventDto,
  UpdateStudentLandingCardDto,
} from './dto/student-landing-card.dto';
import { StudentLandingService } from './student-landing.service';

type AuthenticatedRequest = Request & { user: CurrentUser };
type LandingCardImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@ApiTags('Student landing cards')
@ApiBearerAuth('access-token')
@Controller('student-landing-cards')
export class StudentLandingController {
  constructor(private readonly service: StudentLandingService) {}

  @Get('admin')
  @Permissions('student-landing.read')
  listAdmin(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentLandingCardQueryDto,
  ) {
    return this.service.listForAdmin(request.user, query.organizationId);
  }

  @Post('admin')
  @Permissions('student-landing.create')
  create(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentLandingCardQueryDto,
    @Body() dto: CreateStudentLandingCardDto,
  ) {
    return this.service.create(request.user, query.organizationId, dto);
  }

  @Patch('admin/reorder')
  @Permissions('student-landing.update')
  reorder(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentLandingCardQueryDto,
    @Body() dto: ReorderStudentLandingCardsDto,
  ) {
    return this.service.reorder(
      request.user,
      query.organizationId,
      dto.cardIds,
    );
  }

  @Patch('admin/:id')
  @Permissions('student-landing.update')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentLandingCardDto,
  ) {
    return this.service.update(request.user, id, dto);
  }

  @Delete('admin/:id')
  @Permissions('student-landing.delete')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(request.user, id);
  }

  @Post('admin/:id/image')
  @Permissions('student-landing.update')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Upload a landing card image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  uploadImage(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: LandingCardImageFile | undefined,
  ) {
    return this.service.uploadImage(request.user, id, file);
  }

  @Delete('admin/:id/image')
  @Permissions('student-landing.update')
  deleteImage(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteImage(request.user, id);
  }

  @Get('images/:objectId/:objectUuid')
  @Public()
  @ApiOperation({ summary: 'Stream a managed landing card image' })
  async getImage(
    @Param('objectId', ParseIntPipe) objectId: number,
    @Param('objectUuid', ParseUUIDPipe) objectUuid: string,
  ) {
    const file = await this.service.getImage(objectId, objectUuid);
    const safeName = file.fileName
      .normalize('NFKD')
      .replace(/[^\x20-\x7e]/g, '-')
      .replace(/["\\]/g, '');
    return new StreamableFile(file.content, {
      type: file.mimeType,
      disposition: `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    });
  }

  @Get('student')
  @Roles('STUDENT')
  listStudent(@Req() request: AuthenticatedRequest) {
    return this.service.listForStudent(request.user);
  }

  @Post('student/view')
  @Roles('STUDENT')
  recordPageView(
    @Req() request: AuthenticatedRequest,
    @Body() dto: StudentLandingEventDto,
  ) {
    return this.service.recordPageView(request.user, dto.clientEventId);
  }

  @Post('student/:cardUuid/click')
  @Roles('STUDENT')
  recordCardClick(
    @Req() request: AuthenticatedRequest,
    @Param('cardUuid', ParseUUIDPipe) cardUuid: string,
    @Body() dto: StudentLandingEventDto,
  ) {
    return this.service.recordCardClick(
      request.user,
      cardUuid,
      dto.clientEventId,
    );
  }
}
