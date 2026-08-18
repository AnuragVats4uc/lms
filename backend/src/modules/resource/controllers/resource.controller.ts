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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourceStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CreateDocumentUploadDto } from '../dto/create-document-upload.dto';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceQueryDto } from '../dto/resource-query.dto';
import {
  ResourceListResponseDto,
  ResourceResponseDto,
} from '../dto/resource-response.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import {
  ResourceService,
  ResourceUploadFile,
} from '../services/resource.service';

@ApiTags('Resources')
@ApiBearerAuth('access-token')
@Controller('folders/:folderId/resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  @Permissions('resource.create')
  @ApiOperation({ summary: 'Create a learning resource in a folder' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiBody({ type: CreateResourceDto })
  @ApiCreatedResponse({
    description: 'Resource created successfully',
    type: ResourceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Resource type and type-specific fields are invalid',
  })
  @ApiNotFoundResponse({ description: 'Folder not found' })
  create(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourceService.create(folderId, dto);
  }

  @Post('upload')
  @Permissions('resource.create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload and create a document resource' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string', example: 'Motion Notes' },
        description: { type: 'string', example: 'Chapter notes for motion.' },
        sortOrder: { type: 'integer', example: 0, minimum: 0 },
        status: { enum: Object.values(ResourceStatus) },
        isPublished: { type: 'boolean', example: false },
        isDownloadable: { type: 'boolean', example: true },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Document uploaded and resource created successfully',
    type: ResourceResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Document upload is invalid' })
  @ApiNotFoundResponse({ description: 'Folder not found' })
  uploadDocument(
    @Param('folderId', ParseIntPipe) folderId: number,
    @UploadedFile() file: ResourceUploadFile | undefined,
    @Body() dto: CreateDocumentUploadDto,
  ) {
    return this.resourceService.createUploadedDocument(folderId, dto, file);
  }

  @Get('file/:filename')
  @Permissions('resource.read')
  @ApiOperation({ summary: 'Read an uploaded document resource file' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'filename', type: String, example: 'resource.pdf' })
  @ApiOkResponse({ description: 'Uploaded document file' })
  @ApiNotFoundResponse({ description: 'Document file not found' })
  async readDocumentFile(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('filename') filename: string,
  ) {
    const file = await this.resourceService.readDocumentFile(
      folderId,
      filename,
    );
    return new StreamableFile(file.stream, {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName}"`,
    });
  }

  @Get()
  @Permissions('resource.read')
  @ApiOperation({ summary: 'Get paginated resources in a folder' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Resource list fetched successfully',
    type: ResourceListResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Folder not found' })
  findAll(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Query() query: ResourceQueryDto,
  ) {
    return this.resourceService.findAll(folderId, query);
  }

  @Get(':resourceId')
  @Permissions('resource.read')
  @ApiOperation({ summary: 'Get resource details' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Resource details fetched successfully',
    type: ResourceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Folder or resource not found' })
  findOne(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.resourceService.findOne(folderId, resourceId);
  }

  @Patch(':resourceId')
  @Permissions('resource.update')
  @ApiOperation({ summary: 'Update a learning resource' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiBody({ type: UpdateResourceDto })
  @ApiOkResponse({
    description: 'Resource updated successfully',
    type: ResourceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Resource type and type-specific fields are invalid',
  })
  @ApiNotFoundResponse({ description: 'Folder or resource not found' })
  update(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourceService.update(folderId, resourceId, dto);
  }

  @Patch(':resourceId/upload')
  @Permissions('resource.update')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Replace a document resource file' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Document file replaced successfully',
    type: ResourceResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Document upload is invalid' })
  @ApiNotFoundResponse({ description: 'Folder or resource not found' })
  replaceDocument(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @UploadedFile() file: ResourceUploadFile | undefined,
  ) {
    return this.resourceService.replaceDocumentFile(folderId, resourceId, file);
  }

  @Delete(':resourceId')
  @Permissions('resource.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a learning resource' })
  @ApiParam({ name: 'folderId', type: Number, example: 1 })
  @ApiParam({ name: 'resourceId', type: Number, example: 1 })
  @ApiOkResponse({
    description: 'Resource soft deleted successfully',
    type: ResourceResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Folder or resource not found' })
  remove(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('resourceId', ParseIntPipe) resourceId: number,
  ) {
    return this.resourceService.remove(folderId, resourceId);
  }
}
