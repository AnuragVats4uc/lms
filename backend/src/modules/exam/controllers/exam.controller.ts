import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CurrentUser } from '../../auth/types/current-user.types';
import {
  CreateExamDto,
  CreateExamImportDto,
  CreateExamTemplateDto,
  CreateQuestionDto,
  CreateSubjectDto,
  CreateTopicDto,
  OrganizationScopedQueryDto,
  QuestionListQueryDto,
  SaveTemplateStructureDto,
  TemplateListQueryDto,
  TopicListQueryDto,
  UpdateExamTemplateDto,
  UpdateSubjectDto,
  UpdateTopicDto,
} from '../dto/exam.dto';
import { ExamImportFile, ExamService } from '../services/exam.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Exam subjects')
@ApiBearerAuth('access-token')
@Controller('exam-subjects')
export class ExamSubjectController {
  constructor(private readonly service: ExamService) {}

  @Get()
  @Permissions('subject.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: OrganizationScopedQueryDto,
  ) {
    return this.service.listSubjects(request.user, query);
  }

  @Post()
  @Permissions('subject.create')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateSubjectDto) {
    return this.service.createSubject(request.user, dto);
  }

  @Patch(':id')
  @Permissions('subject.update')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.service.updateSubject(request.user, id, dto);
  }
}

@ApiTags('Exam topics')
@ApiBearerAuth('access-token')
@Controller('exam-topics')
export class ExamTopicController {
  constructor(private readonly service: ExamService) {}

  @Get()
  @Permissions('subject.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: TopicListQueryDto,
  ) {
    return this.service.listTopics(request.user, query);
  }

  @Post()
  @Permissions('subject.create')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateTopicDto) {
    return this.service.createTopic(request.user, dto);
  }

  @Patch(':id')
  @Permissions('subject.update')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.service.updateTopic(request.user, id, dto);
  }
}

@ApiTags('Question bank')
@ApiBearerAuth('access-token')
@Controller('exam-questions')
export class ExamQuestionController {
  constructor(private readonly service: ExamService) {}

  @Get()
  @Permissions('question.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: QuestionListQueryDto,
  ) {
    return this.service.listQuestions(request.user, query);
  }

  @Post()
  @Permissions('question.create')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateQuestionDto) {
    return this.service.createQuestion(request.user, dto);
  }
}

@ApiTags('Exam question types')
@ApiBearerAuth('access-token')
@Controller('exam-question-types')
export class ExamQuestionTypeController {
  constructor(private readonly service: ExamService) {}

  @Get()
  @Permissions('question.read')
  list() {
    return this.service.listQuestionTypes();
  }
}

@ApiTags('Exam templates')
@ApiBearerAuth('access-token')
@Controller('exam-templates')
export class ExamTemplateController {
  constructor(private readonly service: ExamService) {}

  @Get()
  @Permissions('exam-template.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: TemplateListQueryDto,
  ) {
    return this.service.listTemplates(request.user, query);
  }

  @Get(':id')
  @Permissions('exam-template.read')
  get(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getTemplate(request.user, id);
  }

  @Post()
  @Permissions('exam-template.create')
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateExamTemplateDto,
  ) {
    return this.service.createTemplate(request.user, dto);
  }

  @Patch(':id')
  @Permissions('exam-template.update')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamTemplateDto,
  ) {
    return this.service.updateTemplate(request.user, id, dto);
  }

  @Patch(':id/structure')
  @Permissions('exam-template.update')
  saveStructure(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveTemplateStructureDto,
  ) {
    return this.service.saveTemplateStructure(request.user, id, dto);
  }

  @Post(':id/publish')
  @Permissions('exam-template.update')
  publish(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.publishTemplate(request.user, id);
  }

  @Post(':id/versions')
  @Permissions('exam-template.update')
  createVersion(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.createTemplateVersion(request.user, id);
  }
}

@ApiTags('Scheduled exams')
@ApiBearerAuth('access-token')
@Controller('exams')
export class ExamController {
  constructor(private readonly service: ExamService) {}

  @Get()
  @Permissions('exam.read')
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: OrganizationScopedQueryDto,
  ) {
    return this.service.listExams(request.user, query);
  }

  @Get(':id/report')
  @Permissions('exam.read')
  report(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getExamReport(request.user, id);
  }

  @Post()
  @Permissions('exam.create')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateExamDto) {
    return this.service.createExam(request.user, dto);
  }

  @Post(':id/release-results')
  @Permissions('exam.create')
  releaseResults(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.releaseExamResults(request.user, id);
  }
}

@ApiTags('Exam imports')
@ApiBearerAuth('access-token')
@Controller('exam-imports')
export class ExamImportController {
  constructor(private readonly service: ExamService) {}

  @Get('template.xlsx')
  @Permissions('exam-import.read')
  template() {
    return new StreamableFile(this.service.createExcelImportTemplate(), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="exam-question-import-template.xlsx"',
    });
  }

  @Get('template.docx')
  @Permissions('exam-import.read')
  wordTemplate() {
    return new StreamableFile(this.service.createWordImportTemplate(), {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      disposition: 'attachment; filename="exam-question-content-template.docx"',
    });
  }

  @Get('template-codeless.docx')
  @Permissions('exam-import.read')
  codelessWordTemplate() {
    return new StreamableFile(this.service.createCodelessWordImportTemplate(), {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      disposition:
        'attachment; filename="exam-question-code-free-template.docx"',
    });
  }

  @Get('template-codeless.xlsx')
  @Permissions('exam-import.read')
  codelessExcelTemplate() {
    return new StreamableFile(
      this.service.createCodelessExcelImportTemplate(),
      {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition:
          'attachment; filename="exam-question-code-free-mapping-template.xlsx"',
      },
    );
  }

  @Post()
  @Permissions('exam-import.create')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'wordFile', maxCount: 1 },
        { name: 'excelFile', maxCount: 1 },
      ],
      { limits: { fileSize: 15 * 1024 * 1024 } },
    ),
  )
  @ApiConsumes('multipart/form-data')
  stage(
    @Req() request: AuthenticatedRequest,
    @UploadedFiles()
    files:
      | {
          wordFile?: ExamImportFile[];
          excelFile?: ExamImportFile[];
        }
      | undefined,
    @Body() dto: CreateExamImportDto,
  ) {
    return this.service.stageImport(request.user, dto, {
      wordFile: files?.wordFile?.[0],
      excelFile: files?.excelFile?.[0],
    });
  }

  @Get(':id')
  @Permissions('exam-import.read')
  get(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getImport(request.user, id);
  }

  @Post(':id/commit')
  @Permissions('exam-import.create')
  commit(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.commitImport(request.user, id);
  }
}
