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
import { CreateFolderDto } from '../dto/create-folder.dto';
import { FolderQueryDto } from '../dto/folder-query.dto';
import {
  FolderListResponseDto,
  FolderResponseDto,
  FolderTreeResponseDto,
} from '../dto/folder-response.dto';
import { UpdateFolderDto } from '../dto/update-folder.dto';
import { FolderService } from '../services/folder.service';

@ApiTags('Folders')
@ApiBearerAuth('access-token')
@Controller('session-courses/:sessionCourseId/folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @Permissions('folder.create')
  @ApiOperation({ summary: 'Create folder in a session course' })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiBody({ type: CreateFolderDto })
  @ApiCreatedResponse({
    description: 'Folder created successfully',
    type: FolderResponseDto,
  })
  @ApiConflictResponse({ description: 'Folder name already exists' })
  @ApiNotFoundResponse({
    description: 'SessionCourse or parent folder not found',
  })
  create(
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
    @Body() dto: CreateFolderDto,
  ) {
    return this.folderService.create(sessionCourseId, dto);
  }

  @Get()
  @Permissions('folder.read')
  @ApiOperation({ summary: 'Get paginated folder list' })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Folder list fetched successfully',
    type: FolderListResponseDto,
  })
  @ApiNotFoundResponse({ description: 'SessionCourse not found' })
  findAll(
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
    @Query() query: FolderQueryDto,
  ) {
    return this.folderService.findAll(sessionCourseId, query);
  }

  @Get('tree')
  @Permissions('folder.read')
  @ApiOperation({ summary: 'Get hierarchical folder tree' })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Folder tree fetched successfully',
    type: FolderTreeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'SessionCourse not found' })
  findTree(@Param('sessionCourseId', ParseIntPipe) sessionCourseId: number) {
    return this.folderService.findTree(sessionCourseId);
  }

  @Get(':folderId')
  @Permissions('folder.read')
  @ApiOperation({ summary: 'Get folder details' })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Folder details fetched successfully',
    type: FolderResponseDto,
  })
  @ApiNotFoundResponse({ description: 'SessionCourse or folder not found' })
  findOne(
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.folderService.findOne(sessionCourseId, folderId);
  }

  @Patch(':folderId')
  @Permissions('folder.update')
  @ApiOperation({ summary: 'Update folder' })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiBody({ type: UpdateFolderDto })
  @ApiOkResponse({
    description: 'Folder updated successfully',
    type: FolderResponseDto,
  })
  @ApiConflictResponse({
    description: 'Duplicate name or circular folder reference',
  })
  @ApiNotFoundResponse({
    description: 'SessionCourse, parent folder, or folder not found',
  })
  update(
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folderService.update(sessionCourseId, folderId, dto);
  }

  @Delete(':folderId')
  @Permissions('folder.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete folder' })
  @ApiParam({ name: 'sessionCourseId', type: Number, example: 1 })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Folder soft deleted successfully',
    type: FolderResponseDto,
  })
  @ApiNotFoundResponse({ description: 'SessionCourse or folder not found' })
  remove(
    @Param('sessionCourseId', ParseIntPipe) sessionCourseId: number,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.folderService.remove(sessionCourseId, folderId);
  }
}
