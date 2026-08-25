import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExamImportFileKind,
  ExamImportRowStatus,
  ExamImportScope,
  ExamImportStatus,
  ExamResultReleaseMode,
  ExamStatus,
  ExamTemplateStatus,
  ExamTemplateVersionStatus,
  Prisma,
  QuestionStatus,
  ResourceStatus,
  ExamVirtualKeyboardMode,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { deflateSync } from 'node:zlib';

import { CurrentUser } from '../../auth/types/current-user.types';
import {
  CreateExamDto,
  CreateExamImportDto,
  ExamImportMode,
  CreateExamTemplateDto,
  CreateQuestionDto,
  CreateSubjectDto,
  OrganizationScopedQueryDto,
  QuestionListQueryDto,
  QuestionListSort,
  SaveTemplateStructureDto,
  TemplateListQueryDto,
  UpdateExamTemplateDto,
  UpdateSubjectDto,
} from '../dto/exam.dto';
import { ExamRepository } from '../repositories/exam.repository';
import {
  QUESTION_TYPE_CODES,
  type QuestionTypeCode,
} from '../constants/question-type.constants';

export interface ExamImportFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

type StagedRow = {
  sourceRowNumber: number;
  slotCode?: string;
  sectionCode?: string;
  subjectCode?: string;
  questionCode: string;
  questionTypeId?: number;
  rawQuestionTypeId?: number;
  comprehensionCode?: string;
  comprehensionContent?: string;
  questionContent: string;
  marks: number;
  negativeMarks: number;
  sortOrder?: number;
  isMandatory: boolean;
  answer?: string;
  tolerance?: number;
  caseSensitive: boolean;
  explanation?: string;
  options: Array<{ code: string; content: string; isCorrect: boolean }>;
  acceptedAnswers: string[];
  status: ExamImportRowStatus;
  validationMessage?: string;
  rawData: Record<string, unknown>;
};

type WordQuestionContent = Pick<
  StagedRow,
  | 'sourceRowNumber'
  | 'questionCode'
  | 'comprehensionCode'
  | 'comprehensionContent'
  | 'questionContent'
  | 'answer'
  | 'tolerance'
  | 'caseSensitive'
  | 'explanation'
  | 'options'
  | 'acceptedAnswers'
  | 'rawData'
> & { parseErrors?: string[] };

type HtmlBlock = {
  tag: string;
  html: string;
  innerHtml: string;
  text: string;
};

type ExcelQuestionMapping = Pick<
  StagedRow,
  | 'sourceRowNumber'
  | 'slotCode'
  | 'sectionCode'
  | 'subjectCode'
  | 'questionCode'
  | 'rawQuestionTypeId'
  | 'comprehensionCode'
  | 'marks'
  | 'negativeMarks'
  | 'sortOrder'
  | 'isMandatory'
  | 'rawData'
>;

type CodelessWordQuestionContent = Omit<
  WordQuestionContent,
  'questionCode' | 'comprehensionCode'
> & {
  sectionTitle?: string;
  slotTitle?: string;
  subjectTitle?: string;
  sectionCode?: string;
  slotCode?: string;
  subjectCode?: string;
  questionNumber: number;
  questionLabel: string;
  comprehensionLabel?: string;
  questionTypeLabel?: string;
  marks?: number;
  negativeMarks?: number;
  sortOrder?: number;
  isMandatory?: boolean;
};

type ImportJobWithRows = Prisma.ExamImportJobGetPayload<{
  include: {
    rows: { include: { questionType: true } };
    files: true;
    errors: true;
  };
}>;

const templateInclude = {
  primarySubject: true,
  versions: {
    orderBy: { versionNumber: 'desc' as const },
    include: {
      slots: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' as const },
            include: {
              subjects: {
                orderBy: { sortOrder: 'asc' as const },
                include: {
                  subject: true,
                  questions: {
                    orderBy: { sortOrder: 'asc' as const },
                    include: {
                      questionVersion: {
                        include: {
                          question: true,
                          questionType: true,
                          comprehension: true,
                          options: true,
                          acceptedAnswers: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ExamTemplateInclude;

@Injectable()
export class ExamService {
  constructor(private readonly repository: ExamRepository) {}

  private get prisma() {
    return this.repository.client;
  }

  async listSubjects(user: CurrentUser, query: OrganizationScopedQueryDto) {
    const organizationId = this.organizationId(user, query.organizationId);
    return this.prisma.subject.findMany({
      where: { organizationId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  listQuestionTypes() {
    return this.prisma.questionType.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async createSubject(user: CurrentUser, dto: CreateSubjectDto) {
    const organizationId = this.organizationId(user, dto.organizationId);
    try {
      return await this.prisma.subject.create({
        data: {
          organizationId,
          code: dto.code.toUpperCase(),
          name: dto.name,
          description: dto.description,
        },
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'A subject with this code or name already exists',
      );
    }
  }

  async updateSubject(user: CurrentUser, id: number, dto: UpdateSubjectDto) {
    const subject = await this.subjectForUser(user, id);
    return this.prisma.subject.update({ where: { id: subject.id }, data: dto });
  }

  async listQuestions(user: CurrentUser, query: QuestionListQueryDto) {
    const organizationId = this.organizationId(user, query.organizationId);
    const search = query.search?.trim();
    const orderBy: Prisma.QuestionOrderByWithRelationInput[] =
      query.sort === QuestionListSort.OLDEST
        ? [{ createdAt: 'asc' }, { code: 'asc' }]
        : query.sort === QuestionListSort.CODE
          ? [{ code: 'asc' }]
          : query.sort === QuestionListSort.RECENTLY_UPDATED
            ? [{ updatedAt: 'desc' }, { code: 'asc' }]
            : [{ createdAt: 'desc' }, { code: 'asc' }];
    return this.prisma.question.findMany({
      where: {
        organizationId,
        isActive: true,
        subjectId: query.subjectId,
        status: query.status,
        versions: query.questionTypeId
          ? { some: { questionTypeId: query.questionTypeId } }
          : undefined,
        OR: search
          ? [
              { code: { contains: search } },
              { versions: { some: { content: { contains: search } } } },
            ]
          : undefined,
      },
      include: {
        subject: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
            acceptedAnswers: true,
            questionType: true,
            comprehension: true,
          },
        },
      },
      orderBy,
      take: query.limit,
    });
  }

  async createQuestion(user: CurrentUser, dto: CreateQuestionDto) {
    const organizationId = this.organizationId(user, dto.organizationId);
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, organizationId, isActive: true },
    });
    if (!subject)
      throw new BadRequestException(
        'Subject does not belong to this organization',
      );
    const questionType = await this.prisma.questionType.findFirst({
      where: { id: dto.questionTypeId, isActive: true },
    });
    if (!questionType)
      throw new BadRequestException('Question type does not exist');
    this.validateQuestion(
      questionType.code as QuestionTypeCode,
      dto.options,
      dto.acceptedAnswers,
    );

    try {
      return await this.prisma.question.create({
        data: {
          organizationId,
          subjectId: dto.subjectId,
          code: dto.code.toUpperCase(),
          status: dto.status ?? QuestionStatus.DRAFT,
          versions: {
            create: {
              versionNumber: 1,
              questionTypeId: questionType.id,
              content: this.sanitizeRichHtml(dto.content),
              explanation: dto.explanation
                ? this.sanitizeRichHtml(dto.explanation)
                : undefined,
              defaultMarks: dto.defaultMarks,
              defaultNegativeMarks: dto.defaultNegativeMarks,
              caseSensitive: dto.caseSensitive ?? false,
              normalizeWhitespace: dto.normalizeWhitespace ?? true,
              virtualKeyboardMode:
                dto.virtualKeyboardMode ?? ExamVirtualKeyboardMode.NONE,
              allowPhysicalKeyboard: dto.allowPhysicalKeyboard ?? true,
              allowPaste: dto.allowPaste ?? true,
              maxAnswerLength: dto.maxAnswerLength,
              isPublished: dto.status === QuestionStatus.PUBLISHED,
              options: dto.options?.length
                ? {
                    create: dto.options.map((option, sortOrder) => ({
                      ...option,
                      code: option.code.toUpperCase(),
                      content: this.sanitizeRichHtml(option.content),
                      sortOrder,
                    })),
                  }
                : undefined,
              acceptedAnswers: dto.acceptedAnswers?.length
                ? {
                    create: dto.acceptedAnswers.map((value, sortOrder) => ({
                      textValue:
                        questionType.code === QUESTION_TYPE_CODES.ONE_WORD
                          ? value
                          : undefined,
                      normalizedText:
                        questionType.code === QUESTION_TYPE_CODES.ONE_WORD
                          ? this.normalizeAnswer(value, dto.caseSensitive)
                          : undefined,
                      numericValue:
                        questionType.code === QUESTION_TYPE_CODES.NUMERIC
                          ? value
                          : undefined,
                      numericTolerance:
                        questionType.code === QUESTION_TYPE_CODES.NUMERIC
                          ? (dto.numericTolerance ?? 0)
                          : undefined,
                      isPrimary: sortOrder === 0,
                      sortOrder,
                    })),
                  }
                : undefined,
            },
          },
        },
        include: {
          subject: true,
          versions: {
            include: {
              options: true,
              acceptedAnswers: true,
              questionType: true,
              comprehension: true,
            },
          },
        },
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'Question code already exists in this organization',
      );
    }
  }

  async listTemplates(user: CurrentUser, query: TemplateListQueryDto) {
    const organizationId = this.organizationId(user, query.organizationId);
    const search = query.search?.trim();
    const where: Prisma.ExamTemplateWhereInput = {
      organizationId,
      isActive: true,
      status: query.status,
      primarySubjectId: query.subjectId,
      OR: search
        ? [
            { name: { contains: search } },
            { code: { contains: search } },
            { description: { contains: search } },
          ]
        : undefined,
    };
    const templates = await this.prisma.examTemplate.findMany({
      where,
      include: {
        primarySubject: true,
        _count: { select: { versions: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            _count: { select: { slots: true, exams: true, importJobs: true } },
            slots: {
              orderBy: { sortOrder: 'asc' },
              include: {
                sections: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    subjects: {
                      include: {
                        subject: true,
                        questions: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return templates.map((template) => {
      const latestVersion = template.versions[0];
      const sections =
        latestVersion?.slots.flatMap((slot) => slot.sections) ?? [];
      const questionCount = sections.reduce(
        (total, section) =>
          total +
          section.subjects.reduce(
            (subjectTotal, subject) => subjectTotal + subject.questions.length,
            0,
          ),
        0,
      );
      const derivedSubject =
        template.primarySubject ??
        sections.flatMap((section) => section.subjects)[0]?.subject ??
        null;
      return {
        ...template,
        _summary: {
          durationMinutes: latestVersion?.defaultDurationMinutes ?? null,
          defaultAttemptLimit: latestVersion?.defaultAttemptLimit ?? 1,
          slotCount: latestVersion?.slots.length ?? 0,
          sectionCount: sections.length,
          questionCount,
          latestVersionStatus: latestVersion?.status ?? template.status,
          subject: derivedSubject,
        },
      };
    });
  }

  async getTemplate(user: CurrentUser, id: number) {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException('Exam template not found');
    this.assertOrganization(user, template.organizationId);
    return template;
  }

  async createTemplate(user: CurrentUser, dto: CreateExamTemplateDto) {
    const organizationId = this.organizationId(user, dto.organizationId);
    await this.ensureSubjectBelongsToOrganization(
      organizationId,
      dto.primarySubjectId,
    );
    try {
      return await this.prisma.examTemplate.create({
        data: {
          organizationId,
          primarySubjectId: dto.primarySubjectId,
          code: dto.code.toUpperCase(),
          name: dto.name,
          description: dto.description,
          versions: {
            create: {
              versionNumber: 1,
              instructions: dto.instructions,
              defaultDurationMinutes: dto.defaultDurationMinutes,
              defaultAttemptLimit: dto.defaultAttemptLimit ?? 1,
              enforceSlotTimers: dto.enforceSlotTimers ?? false,
              enforceSectionTimers: dto.enforceSectionTimers ?? false,
            },
          },
        },
        include: templateInclude,
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'Exam template code already exists in this organization',
      );
    }
  }

  async updateTemplate(
    user: CurrentUser,
    templateId: number,
    dto: UpdateExamTemplateDto,
  ) {
    const template = await this.getTemplate(user, templateId);
    await this.ensureSubjectBelongsToOrganization(
      template.organizationId,
      dto.primarySubjectId,
    );
    try {
      return await this.prisma.examTemplate.update({
        where: { id: template.id },
        data: {
          primarySubjectId: dto.primarySubjectId,
          code: dto.code ? dto.code.toUpperCase() : undefined,
          name: dto.name,
          description: dto.description,
        },
        include: templateInclude,
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'Exam template code already exists in this organization',
      );
    }
  }

  async saveTemplateStructure(
    user: CurrentUser,
    templateId: number,
    dto: SaveTemplateStructureDto,
  ) {
    const template = await this.getTemplate(user, templateId);
    const version = template.versions.find(
      (item) => item.status === ExamTemplateVersionStatus.DRAFT,
    );
    if (!version)
      throw new ConflictException(
        'Published template versions are immutable; create a new version first',
      );
    this.validateStructure(dto);

    const subjectIds = [
      ...new Set(
        dto.slots.flatMap((slot) =>
          slot.sections.flatMap((section) =>
            section.subjects.map((subject) => subject.subjectId),
          ),
        ),
      ),
    ];
    const questionVersionIds = [
      ...new Set(
        dto.slots.flatMap((slot) =>
          slot.sections.flatMap((section) =>
            section.subjects.flatMap((subject) =>
              subject.questions.map((question) => question.questionVersionId),
            ),
          ),
        ),
      ),
    ];
    const [subjects, questionVersions] = await Promise.all([
      this.prisma.subject.findMany({
        where: {
          id: { in: subjectIds },
          organizationId: template.organizationId,
          isActive: true,
        },
      }),
      this.prisma.questionVersion.findMany({
        where: {
          id: { in: questionVersionIds },
          question: { organizationId: template.organizationId, isActive: true },
        },
        include: { question: true },
      }),
    ]);
    if (subjects.length !== subjectIds.length)
      throw new BadRequestException(
        'One or more subjects do not belong to the template organization',
      );
    if (questionVersions.length !== questionVersionIds.length)
      throw new BadRequestException(
        'One or more question versions do not belong to the template organization',
      );
    const questionSubject = new Map(
      questionVersions.map((item) => [item.id, item.question.subjectId]),
    );
    for (const slot of dto.slots)
      for (const section of slot.sections)
        for (const subject of section.subjects) {
          if (
            subject.questions.some(
              (question) =>
                questionSubject.get(question.questionVersionId) !==
                subject.subjectId,
            )
          ) {
            throw new BadRequestException(
              `A question in section ${section.code} does not belong to subject ${subject.subjectId}`,
            );
          }
        }

    await this.prisma.$transaction(async (tx) => {
      await tx.examTemplateVersion.update({
        where: { id: version.id },
        data: {
          instructions: dto.instructions,
          defaultDurationMinutes: dto.defaultDurationMinutes,
          defaultAttemptLimit: dto.defaultAttemptLimit ?? 1,
          enforceSlotTimers: dto.enforceSlotTimers ?? false,
          enforceSectionTimers: dto.enforceSectionTimers ?? false,
        },
      });
      await tx.examTemplateSlot.deleteMany({
        where: { examTemplateVersionId: version.id },
      });
      for (const [slotIndex, slot] of dto.slots.entries()) {
        await tx.examTemplateSlot.create({
          data: {
            examTemplateVersionId: version.id,
            code: slot.code.toUpperCase(),
            name: slot.name,
            description: slot.description,
            instructions: slot.instructions,
            durationMinutes: slot.durationMinutes,
            navigationMode: slot.navigationMode,
            autoSubmitOnTimeout: slot.autoSubmitOnTimeout ?? true,
            sortOrder: slotIndex,
            sections: {
              create: slot.sections.map((section, sectionIndex) => ({
                code: section.code.toUpperCase(),
                name: section.name,
                instructions: section.instructions,
                durationMinutes: section.durationMinutes,
                questionsToAttempt: section.questionsToAttempt,
                randomizeQuestions: section.randomizeQuestions ?? false,
                randomizeOptions: section.randomizeOptions ?? false,
                navigationMode: section.navigationMode,
                allowReview: section.allowReview ?? true,
                autoSubmitOnTimeout: section.autoSubmitOnTimeout ?? true,
                sortOrder: sectionIndex,
                subjects: {
                  create: section.subjects.map((subject, subjectIndex) => ({
                    subjectId: subject.subjectId,
                    isMandatory: subject.isMandatory ?? true,
                    sortOrder: subjectIndex,
                    questions: {
                      create: subject.questions.map(
                        (question, questionIndex) => ({
                          questionVersionId: question.questionVersionId,
                          marks: question.marks,
                          negativeMarks: question.negativeMarks,
                          isMandatory: question.isMandatory ?? true,
                          sortOrder: questionIndex,
                        }),
                      ),
                    },
                  })),
                },
              })),
            },
          },
        });
      }
    });
    return this.getTemplate(user, templateId);
  }

  async publishTemplate(user: CurrentUser, templateId: number) {
    const template = await this.getTemplate(user, templateId);
    const version = template.versions.find(
      (item) => item.status === ExamTemplateVersionStatus.DRAFT,
    );
    if (!version)
      throw new ConflictException('No draft version is available to publish');
    const questionCount = version.slots.reduce(
      (count, slot) =>
        count +
        slot.sections.reduce(
          (sectionCount, section) =>
            sectionCount +
            section.subjects.reduce(
              (subjectCount, subject) =>
                subjectCount + subject.questions.length,
              0,
            ),
          0,
        ),
      0,
    );
    if (!version.slots.length || !questionCount)
      throw new BadRequestException(
        'A template must contain at least one slot and one question before publishing',
      );
    await this.prisma.$transaction([
      this.prisma.examTemplateVersion.update({
        where: { id: version.id },
        data: {
          status: ExamTemplateVersionStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      }),
      this.prisma.examTemplate.update({
        where: { id: template.id },
        data: { status: ExamTemplateStatus.PUBLISHED },
      }),
    ]);
    return this.getTemplate(user, templateId);
  }

  async createTemplateVersion(user: CurrentUser, templateId: number) {
    const template = await this.getTemplate(user, templateId);
    if (
      template.versions.some(
        (item) => item.status === ExamTemplateVersionStatus.DRAFT,
      )
    ) {
      throw new ConflictException('This template already has a draft version');
    }
    const source = template.versions[0];
    if (!source)
      throw new BadRequestException('The template has no source version');
    await this.prisma.examTemplateVersion.create({
      data: {
        examTemplateId: template.id,
        versionNumber: source.versionNumber + 1,
        instructions: source.instructions,
        defaultDurationMinutes: source.defaultDurationMinutes,
        defaultAttemptLimit: source.defaultAttemptLimit,
        enforceSlotTimers: source.enforceSlotTimers,
        enforceSectionTimers: source.enforceSectionTimers,
        slots: {
          create: source.slots.map((slot) => ({
            code: slot.code,
            name: slot.name,
            description: slot.description,
            instructions: slot.instructions,
            durationMinutes: slot.durationMinutes,
            navigationMode: slot.navigationMode,
            autoSubmitOnTimeout: slot.autoSubmitOnTimeout,
            sortOrder: slot.sortOrder,
            isActive: slot.isActive,
            sections: {
              create: slot.sections.map((section) => ({
                code: section.code,
                name: section.name,
                instructions: section.instructions,
                durationMinutes: section.durationMinutes,
                questionsToAttempt: section.questionsToAttempt,
                randomizeQuestions: section.randomizeQuestions,
                randomizeOptions: section.randomizeOptions,
                navigationMode: section.navigationMode,
                allowReview: section.allowReview,
                autoSubmitOnTimeout: section.autoSubmitOnTimeout,
                sortOrder: section.sortOrder,
                isActive: section.isActive,
                subjects: {
                  create: section.subjects.map((subject) => ({
                    subjectId: subject.subjectId,
                    isMandatory: subject.isMandatory,
                    sortOrder: subject.sortOrder,
                    questions: {
                      create: subject.questions.map((question) => ({
                        questionVersionId: question.questionVersionId,
                        marks: question.marks,
                        negativeMarks: question.negativeMarks,
                        isMandatory: question.isMandatory,
                        sortOrder: question.sortOrder,
                      })),
                    },
                  })),
                },
              })),
            },
          })),
        },
      },
    });
    return this.getTemplate(user, templateId);
  }

  async listExams(user: CurrentUser, query: OrganizationScopedQueryDto) {
    const organizationId = this.organizationId(user, query.organizationId);
    return this.prisma.exam.findMany({
      where: { organizationId, isActive: true },
      include: {
        session: true,
        templateVersion: { include: { examTemplate: true } },
        selectedSlots: { include: { templateSlot: true } },
        courseAssignments: {
          include: { sessionCourse: { include: { course: true } } },
        },
        resources: true,
      },
      orderBy: { availableFrom: 'desc' },
    });
  }

  async createExam(user: CurrentUser, dto: CreateExamDto) {
    const organizationId = this.organizationId(user, dto.organizationId);
    const availableFrom = new Date(dto.availableFrom);
    const availableUntil = new Date(dto.availableUntil);
    if (availableUntil <= availableFrom)
      throw new BadRequestException(
        'Exam end time must be after its start time',
      );
    const version = await this.prisma.examTemplateVersion.findFirst({
      where: {
        id: dto.examTemplateVersionId,
        status: ExamTemplateVersionStatus.PUBLISHED,
        examTemplate: { organizationId },
      },
      include: { slots: true },
    });
    if (!version)
      throw new BadRequestException(
        'Only a published template version can be scheduled',
      );
    const selectedSlots = version.slots.filter((slot) =>
      dto.selectedSlotIds.includes(slot.id),
    );
    if (selectedSlots.length !== new Set(dto.selectedSlotIds).size)
      throw new BadRequestException(
        'A selected slot does not belong to this template version',
      );
    const session = await this.prisma.session.findFirst({
      where: { id: dto.sessionId, organizationId, isActive: true },
    });
    if (!session)
      throw new BadRequestException(
        'Session does not belong to this organization',
      );
    const courses = await this.prisma.sessionCourse.findMany({
      where: {
        id: { in: dto.sessionCourseIds },
        sessionId: dto.sessionId,
        isActive: true,
      },
    });
    if (courses.length !== new Set(dto.sessionCourseIds).size)
      throw new BadRequestException(
        'A selected course does not belong to the exam session',
      );
    if (dto.resourceFolderId) {
      const folder = await this.prisma.folder.findFirst({
        where: {
          id: dto.resourceFolderId,
          sessionCourseId: { in: dto.sessionCourseIds },
          isActive: true,
        },
      });
      if (!folder)
        throw new BadRequestException(
          'Resource folder must belong to one of the selected session courses',
        );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const exam = await tx.exam.create({
          data: {
            organizationId,
            sessionId: dto.sessionId,
            examTemplateVersionId: dto.examTemplateVersionId,
            code: dto.code.toUpperCase(),
            title: dto.title,
            instructions: dto.instructions,
            availableFrom,
            availableUntil,
            durationMinutes: dto.durationMinutes,
            attemptLimit: dto.attemptLimit,
            autoSubmitOnTimeout: dto.autoSubmitOnTimeout ?? true,
            allowResume: dto.allowResume ?? true,
            resultReleaseMode:
              dto.resultReleaseMode ?? ExamResultReleaseMode.IMMEDIATE,
            showScore: dto.showScore ?? true,
            showCorrectAnswers: dto.showCorrectAnswers ?? false,
            showExplanations: dto.showExplanations ?? false,
            showQuestionReview: dto.showQuestionReview ?? false,
            resultPublishAt: dto.resultPublishAt
              ? new Date(dto.resultPublishAt)
              : undefined,
            status: dto.status ?? ExamStatus.DRAFT,
            selectedSlots: {
              create: dto.selectedSlotIds.map(
                (examTemplateSlotId, sortOrder) => ({
                  examTemplateSlotId,
                  sortOrder,
                }),
              ),
            },
            courseAssignments: {
              create: dto.sessionCourseIds.map((sessionCourseId) => ({
                sessionCourseId,
              })),
            },
          },
        });
        if (dto.resourceFolderId) {
          const published =
            dto.status === ExamStatus.SCHEDULED ||
            dto.status === ExamStatus.LIVE;
          await tx.resource.create({
            data: {
              folderId: dto.resourceFolderId,
              resourceTypeId: 3,
              examId: exam.id,
              title: exam.title,
              description: exam.instructions,
              status: published
                ? ResourceStatus.PUBLISHED
                : ResourceStatus.DRAFT,
              isPublished: published,
              isDownloadable: false,
            },
          });
        }
        return exam;
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'Exam code already exists in this organization',
      );
    }
  }

  async releaseExamResults(user: CurrentUser, examId: number) {
    const organizationId = this.organizationId(user);
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, organizationId, isActive: true },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return this.prisma.exam.update({
      where: { id: exam.id },
      data: { resultsReleasedAt: new Date() },
    });
  }

  async stageImport(
    user: CurrentUser,
    dto: CreateExamImportDto,
    files: {
      wordFile?: ExamImportFile;
      excelFile?: ExamImportFile;
    },
  ) {
    const wordFile = files.wordFile;
    const excelFile = files.excelFile;
    const importMode =
      dto.importMode ??
      (excelFile
        ? ExamImportMode.PAIRED_WORD_EXCEL
        : ExamImportMode.CODELESS_WORD);
    if (!wordFile)
      throw new BadRequestException('A Word content file is required');
    if (importMode === ExamImportMode.PAIRED_WORD_EXCEL && !excelFile)
      throw new BadRequestException(
        'Both a Word content file and an Excel mapping file are required',
      );
    if (
      wordFile.size > 15 * 1024 * 1024 ||
      (excelFile?.size ?? 0) > 15 * 1024 * 1024
    )
      throw new BadRequestException(
        'Each import file must be 15 MB or smaller',
      );
    if (extname(wordFile.originalname).toLowerCase() !== '.docx')
      throw new BadRequestException('The content file must be a .docx file');
    if (
      excelFile &&
      extname(excelFile.originalname).toLowerCase() !== '.xlsx'
    )
      throw new BadRequestException('The mapping file must be a .xlsx file');
    const version = await this.prisma.examTemplateVersion.findUnique({
      where: { id: dto.examTemplateVersionId },
      include: { examTemplate: true },
    });
    if (!version)
      throw new NotFoundException('Exam template version not found');
    this.assertOrganization(user, version.examTemplate.organizationId);
    if (version.status !== ExamTemplateVersionStatus.DRAFT)
      throw new ConflictException(
        'Questions can only be imported into a draft template version',
      );
    if (
      dto.scope === ExamImportScope.SINGLE_SECTION &&
      !dto.examTemplateSectionId
    ) {
      throw new BadRequestException(
        'Single-section import requires a target section',
      );
    }

    const effectiveDto = { ...dto };
    if (dto.scope === ExamImportScope.SINGLE_SECTION) {
      const section = await this.prisma.examTemplateSection.findFirst({
        where: {
          id: dto.examTemplateSectionId,
          examTemplateSlot: { examTemplateVersionId: version.id },
        },
        include: { subjects: true },
      });
      if (!section)
        throw new BadRequestException(
          'Target section does not belong to this template version',
        );
      if (section.subjects.length !== 1)
        throw new BadRequestException(
          'The target section must contain exactly one subject',
        );
      effectiveDto.examTemplateSlotId = section.examTemplateSlotId;
      effectiveDto.subjectId = section.subjects[0].subjectId;
    }

    const wordFileHash = this.fileHash(wordFile.buffer);
    const excelFileHash = excelFile ? this.fileHash(excelFile.buffer) : '';
    const importFingerprint = this.importFingerprint({
      importMode,
      organizationId: version.examTemplate.organizationId,
      examTemplateVersionId: version.id,
      scope: effectiveDto.scope,
      examTemplateSlotId: effectiveDto.examTemplateSlotId,
      examTemplateSectionId: effectiveDto.examTemplateSectionId,
      subjectId: effectiveDto.subjectId,
      wordFileHash,
      excelFileHash,
    });
    const duplicateImport = await this.prisma.examImportJob.findUnique({
      where: { importFingerprint },
      select: { id: true, status: true },
    });
    if (duplicateImport)
      throw new ConflictException(
        `This import has already been uploaded for this destination (import #${duplicateImport.id}, status: ${duplicateImport.status})`,
      );

    const questionTypes = await this.prisma.questionType.findMany({
      where: { isActive: true },
    });
    const rows =
      importMode === ExamImportMode.CODELESS_WORD
        ? await this.buildCodelessWordRows(
            wordFile.buffer,
            version.id,
            effectiveDto,
            questionTypes,
          )
        : this.mergeImportFiles(
            await this.parseWordContent(wordFile.buffer),
            this.parseWorkbookMappings(excelFile!.buffer),
            questionTypes,
          );
    await this.validateImportDestinations(
      version.id,
      version.examTemplate.organizationId,
      effectiveDto,
      rows,
    );
    const directory = join(process.cwd(), 'uploads', 'exam-imports');
    await mkdir(directory, { recursive: true });
    const wordStoragePath = join(
      directory,
      `${importFingerprint}.content.docx`,
    );
    const excelStoragePath = excelFile
      ? join(directory, `${importFingerprint}.mapping.xlsx`)
      : undefined;
    await Promise.all(
      [
        writeFile(wordStoragePath, wordFile.buffer),
        excelStoragePath && writeFile(excelStoragePath, excelFile!.buffer),
      ].filter(Boolean) as Array<Promise<void>>,
    );
    const counts = this.importCounts(rows);

    try {
      return await this.prisma.examImportJob.create({
        data: {
          importFingerprint,
          organizationId: version.examTemplate.organizationId,
          examTemplateVersionId: version.id,
          examTemplateSlotId: effectiveDto.examTemplateSlotId,
          examTemplateSectionId: effectiveDto.examTemplateSectionId,
          subjectId: effectiveDto.subjectId,
          uploadedById: user.userId,
          scope: effectiveDto.scope,
          status: counts.errorRows
            ? ExamImportStatus.VALIDATION_FAILED
            : ExamImportStatus.READY_FOR_REVIEW,
          ...counts,
          files: {
            create: [
              {
                kind: ExamImportFileKind.CONTENT_DOCX,
                originalFileName: wordFile.originalname,
                storagePath: wordStoragePath,
                fileHash: wordFileHash,
                mimeType: wordFile.mimetype,
                sizeBytes: wordFile.size,
              },
              ...(excelFile && excelStoragePath
                ? [
                    {
                      kind: ExamImportFileKind.MAPPING_XLSX,
                      originalFileName: excelFile.originalname,
                      storagePath: excelStoragePath,
                      fileHash: excelFileHash,
                      mimeType: excelFile.mimetype,
                      sizeBytes: excelFile.size,
                    },
                  ]
                : []),
            ],
          },
          rows: {
            create: rows.map((row) => ({
              sourceIndex: row.sourceRowNumber,
              slotCode: row.slotCode,
              sectionCode: row.sectionCode,
              subjectCode: row.subjectCode,
              questionCode: row.questionCode,
              questionTypeId: row.questionTypeId,
              rawQuestionTypeId: row.rawQuestionTypeId,
              comprehensionCode: row.comprehensionCode,
              comprehensionText: row.comprehensionContent,
              questionText: row.questionContent,
              marks: row.marks,
              negativeMarks: row.negativeMarks,
              sortOrder: row.sortOrder,
              isMandatory: row.isMandatory,
              correctAnswer: row.answer,
              numericTolerance: row.tolerance,
              caseSensitive: row.caseSensitive,
              explanation: row.explanation,
              optionsJson: row.options,
              acceptedAnswersJson: row.acceptedAnswers,
              rawData: row.rawData as Prisma.InputJsonValue,
              status: row.status,
              validationMessage: row.validationMessage,
            })),
          },
        },
        include: {
          files: true,
          rows: { include: { questionType: true } },
          errors: true,
        },
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'This Word and Excel file pair has already been uploaded for this destination',
      );
    }
  }

  async getImport(user: CurrentUser, id: number): Promise<ImportJobWithRows> {
    const job = await this.prisma.examImportJob.findUnique({
      where: { id },
      include: {
        files: true,
        rows: {
          orderBy: { sourceIndex: 'asc' },
          include: { questionType: true },
        },
        errors: true,
      },
    });
    if (!job) throw new NotFoundException('Exam import job not found');
    this.assertOrganization(user, job.organizationId);
    return job;
  }

  async commitImport(user: CurrentUser, id: number) {
    const job = await this.getImport(user, id);
    if (job.status !== ExamImportStatus.READY_FOR_REVIEW)
      throw new ConflictException(
        'Only a fully valid reviewed import can be committed',
      );
    const claimed = await this.prisma.examImportJob.updateMany({
      where: { id, status: ExamImportStatus.READY_FOR_REVIEW },
      data: { status: ExamImportStatus.IMPORTING },
    });
    if (claimed.count !== 1)
      throw new ConflictException(
        'This import is already being committed or is no longer ready for review',
      );
    try {
      await this.prisma.$transaction(
        async (tx) => {
          for (const row of job.rows) {
            const destination = await this.resolveImportDestination(
              tx,
              job,
              row,
            );
            if (
              !row.questionCode ||
              !row.questionType ||
              !row.questionText ||
              row.marks === null ||
              row.negativeMarks === null
            ) {
              throw new BadRequestException(
                `Staged row ${row.sourceIndex} is incomplete`,
              );
            }
            const questionTypeCode = row.questionType.code as QuestionTypeCode;
            const existing = await tx.question.findUnique({
              where: {
                organizationId_code: {
                  organizationId: job.organizationId,
                  code: row.questionCode,
                },
              },
            });
            if (existing)
              throw new ConflictException(
                existing.subjectId === destination.subjectId
                  ? `Question ${row.questionCode} already exists in the question bank; imports only create new questions`
                  : `Question ${row.questionCode} already belongs to another subject`,
              );
            const question = await tx.question.create({
              data: {
                organizationId: job.organizationId,
                subjectId: destination.subjectId,
                code: row.questionCode,
                status: QuestionStatus.DRAFT,
              },
            });
            const comprehension = row.comprehensionCode
              ? await tx.questionComprehension.upsert({
                  where: {
                    organizationId_code: {
                      organizationId: job.organizationId,
                      code: row.comprehensionCode,
                    },
                  },
                  create: {
                    organizationId: job.organizationId,
                    code: row.comprehensionCode,
                    content: row.comprehensionText ?? '',
                  },
                  update: {
                    content: row.comprehensionText ?? '',
                    isActive: true,
                  },
                })
              : null;
            const options =
              (row.optionsJson as Array<{
                code: string;
                content: string;
                isCorrect: boolean;
              }> | null) ?? [];
            const acceptedAnswers =
              (row.acceptedAnswersJson as string[] | null) ?? [];
            const questionVersion = await tx.questionVersion.create({
              data: {
                questionId: question.id,
                versionNumber: 1,
                questionTypeId: row.questionType.id,
                comprehensionId: comprehension?.id,
                content: row.questionText,
                explanation: row.explanation,
                defaultMarks: row.marks,
                defaultNegativeMarks: row.negativeMarks,
                caseSensitive: row.caseSensitive,
                options: options.length
                  ? {
                      create: options.map((option, sortOrder) => ({
                        ...option,
                        sortOrder,
                      })),
                    }
                  : undefined,
                acceptedAnswers: acceptedAnswers.length
                  ? {
                      create: acceptedAnswers.map((answer, sortOrder) => ({
                        textValue:
                          questionTypeCode === QUESTION_TYPE_CODES.ONE_WORD
                            ? answer
                            : undefined,
                        normalizedText:
                          questionTypeCode === QUESTION_TYPE_CODES.ONE_WORD
                            ? this.normalizeAnswer(answer, row.caseSensitive)
                            : undefined,
                        numericValue:
                          questionTypeCode === QUESTION_TYPE_CODES.NUMERIC
                            ? answer
                            : undefined,
                        numericTolerance:
                          questionTypeCode === QUESTION_TYPE_CODES.NUMERIC
                            ? (row.numericTolerance ?? 0)
                            : undefined,
                        isPrimary: sortOrder === 0,
                        sortOrder,
                      })),
                    }
                  : undefined,
              },
            });
            const sectionSubject = await tx.examTemplateSectionSubject.upsert({
              where: {
                examTemplateSectionId_subjectId: {
                  examTemplateSectionId: destination.sectionId,
                  subjectId: destination.subjectId,
                },
              },
              create: {
                examTemplateSectionId: destination.sectionId,
                subjectId: destination.subjectId,
              },
              update: {},
            });
            await tx.examTemplateQuestion.create({
              data: {
                examTemplateSectionSubjectId: sectionSubject.id,
                questionVersionId: questionVersion.id,
                marks: row.marks,
                negativeMarks: row.negativeMarks,
                sortOrder: row.sortOrder ?? row.sourceIndex,
                isMandatory: row.isMandatory,
              },
            });
            await tx.examImportRow.update({
              where: { id: row.id },
              data: { status: ExamImportRowStatus.IMPORTED },
            });
          }
          await tx.examImportJob.update({
            where: { id },
            data: { status: ExamImportStatus.IMPORTED, importedAt: new Date() },
          });
        },
        { timeout: 30000 },
      );
    } catch (error) {
      await this.prisma.examImportJob.update({
        where: { id },
        data: {
          status: ExamImportStatus.FAILED,
          errorSummary:
            error instanceof Error ? error.message : 'Import failed',
        },
      });
      this.rethrowUnique(
        error,
        'One or more question codes already exist in the question bank',
      );
    }
    return this.getImport(user, id);
  }

  createExcelImportTemplate() {
    const rows = [
      {
        question_code: 'ENG-RC-001',
        comprehension_code: 'RC-001',
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        question_type_id: 1,
        marks: 5,
        negative_marks: 1,
        sort_order: 1,
        is_mandatory: true,
      },
      {
        question_code: 'MAT-NUM-001',
        comprehension_code: '',
        slot_code: 'CUET_SLOT_1',
        section_code: 'QUANT',
        subject_code: 'MATHEMATICS',
        question_type_id: 2,
        marks: 5,
        negative_marks: 0,
        sort_order: 2,
        is_mandatory: true,
      },
      {
        question_code: 'ENG-RC-002',
        comprehension_code: 'RC-001',
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        question_type_id: 1,
        marks: 5,
        negative_marks: 1,
        sort_order: 3,
        is_mandatory: true,
      },
      {
        question_code: 'ENG-WORD-001',
        comprehension_code: '',
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        question_type_id: 3,
        marks: 5,
        negative_marks: 0,
        sort_order: 4,
        is_mandatory: true,
      },
    ];
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Question Mapping');
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          id: 1,
          code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
          name: 'Single Answer',
        },
        { id: 2, code: QUESTION_TYPE_CODES.NUMERIC, name: 'Numeric Answer' },
        { id: 3, code: QUESTION_TYPE_CODES.ONE_WORD, name: 'One Word Answer' },
      ]),
      'Question Types',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['Paired exam import'],
        ['Upload this Excel file together with one Word content file.'],
        [
          'question_code is the exact join key and must occur once in each file.',
        ],
        [
          'Excel owns placement, question_type_id, marking, order, and mandatory status.',
        ],
        [
          'Word owns comprehension, question text, images, options, answers, tolerance, case sensitivity, and explanation.',
        ],
      ]),
      'Instructions',
    );
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  createCodelessWordImportTemplate() {
    const p = (text: string, style?: 'Heading1' | 'Heading2' | 'Heading3') =>
      `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${this.escapeXml(text)}</w:t></w:r></w:p>`;
    const table = (rows: Array<[string, string]>) =>
      `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8E2E9"/><w:left w:val="single" w:sz="4" w:color="D8E2E9"/><w:bottom w:val="single" w:sz="4" w:color="D8E2E9"/><w:right w:val="single" w:sz="4" w:color="D8E2E9"/><w:insideH w:val="single" w:sz="4" w:color="D8E2E9"/><w:insideV w:val="single" w:sz="4" w:color="D8E2E9"/></w:tblBorders></w:tblPr>${rows
        .map(([label, value]) => `<w:tr><w:tc>${p(label)}</w:tc><w:tc>${p(value)}</w:tc></w:tr>`)
        .join('')}</w:tbl>`;
    const answerRules = (
      type: string,
      marks: string,
      negativeMarks: string,
      correctOption: string,
      acceptedAnswers: string,
      tolerance: string,
    ) =>
      table([
        ['Question Type', type],
        ['Marks', marks],
        ['Negative Marks', negativeMarks],
        ['Correct Option', correctOption],
        ['Accepted Answers', acceptedAnswers],
        ['Numeric Tolerance', tolerance],
        ['Case Sensitive', 'No'],
        ['Mandatory', 'Yes'],
      ]);
    const body = [
      p('Code-free Exam Import - Word Template'),
      p('Use the same Heading styles. The system generates internal codes automatically.'),
      p('English Language | Slot: Slot 1 | Section: English Language | Subject: English'),
      p('Comprehension - 1 to 5', 'Heading1'),
      p('Paste the passage text here. Images can be inserted directly in the passage.'),
      p('Question - 1', 'Heading2'),
      p('Choose the word closest in meaning to concise.'),
      p('Options', 'Heading3'),
      table([
        ['A', 'Brief'],
        ['B', 'Unclear'],
        ['C', 'Lengthy'],
        ['D', 'Complex'],
      ]),
      p('Answer Rules', 'Heading3'),
      answerRules('Single Choice', '5', '1', 'A', '', ''),
      p('Explanation', 'Heading3'),
      p('Concise means brief and clear.'),
      p('Standalone Questions', 'Heading1'),
      p('Question - 2', 'Heading2'),
      p('What is 15% of 240?'),
      p('Answer Rules', 'Heading3'),
      answerRules('Numeric', '5', '0', '', '36', '0'),
      p('Explanation', 'Heading3'),
      p('0.15 multiplied by 240 equals 36.'),
    ].join('');
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`;
    const stylesXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style></w:styles>';
    return this.createStoredZip([
      {
        name: '[Content_Types].xml',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
      },
      {
        name: '_rels/.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      },
      { name: 'word/document.xml', data: documentXml },
      { name: 'word/styles.xml', data: stylesXml },
      {
        name: 'word/_rels/document.xml.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      },
    ]);
  }

  createWordImportTemplate() {
    const p = (text: string, style?: 'Heading1' | 'Heading2' | 'Heading3') =>
      `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${this.escapeXml(text)}</w:t></w:r></w:p>`;
    const image = (relationshipId: string, id: number, name: string) =>
      `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="3657600" cy="1828800"/><wp:docPr id="${id}" name="${this.escapeXml(name)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${this.escapeXml(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="3657600" cy="1828800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    const table = (rows: Array<[string, { text?: string; image?: boolean }]>) =>
      `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8E2E9"/><w:left w:val="single" w:sz="4" w:color="D8E2E9"/><w:bottom w:val="single" w:sz="4" w:color="D8E2E9"/><w:right w:val="single" w:sz="4" w:color="D8E2E9"/><w:insideH w:val="single" w:sz="4" w:color="D8E2E9"/><w:insideV w:val="single" w:sz="4" w:color="D8E2E9"/></w:tblBorders></w:tblPr>${rows
        .map(
          ([label, content]) =>
            `<w:tr><w:tc>${p(label)}</w:tc><w:tc>${content.image ? image('rId2', 2, `${label} image`) : p(content.text ?? '')}</w:tc></w:tr>`,
        )
        .join('')}</w:tbl>`;
    const answerRules = (
      correctOption: string,
      acceptedAnswers: string,
      tolerance: string,
      caseSensitive: string,
    ) =>
      table([
        ['Correct Option', { text: correctOption }],
        ['Accepted Answers', { text: acceptedAnswers }],
        ['Numeric Tolerance', { text: tolerance }],
        ['Case Sensitive', { text: caseSensitive }],
      ]);
    const body = [
      p('Paired Exam Import — Word Content Template'),
      p(
        'Use Word Heading styles exactly as shown. Question codes must match the Excel mapping file.',
      ),
      p('Comprehension — RC-001', 'Heading1'),
      p(
        'Read the passage and study the embedded diagram. A concise message communicates its central idea clearly without unnecessary words.',
      ),
      image('rId1', 1, 'Comprehension diagram'),
      p('Question — ENG-RC-001', 'Heading2'),
      p('Choose the word closest in meaning to concise.'),
      p('Options', 'Heading3'),
      table([
        ['A', { text: 'Brief' }],
        ['B', { text: 'Unclear' }],
        ['C', { text: 'Lengthy' }],
        ['D', { image: true }],
      ]),
      p('Answer Rules', 'Heading3'),
      answerRules('A', '', '', 'No'),
      p('Explanation', 'Heading3'),
      p('Concise means brief and clear.'),
      p('Question — ENG-RC-002', 'Heading2'),
      p('What does a concise message avoid?'),
      p('Options', 'Heading3'),
      table([
        ['A', { text: 'A central idea' }],
        ['B', { text: 'Unnecessary words' }],
        ['C', { text: 'Clear language' }],
        ['D', { text: 'Useful detail' }],
      ]),
      p('Answer Rules', 'Heading3'),
      answerRules('B', '', '', 'No'),
      p('Explanation', 'Heading3'),
      p('The passage states that concise writing avoids unnecessary words.'),
      p('Standalone Questions', 'Heading1'),
      p('Question — MAT-NUM-001', 'Heading2'),
      p('What is 15% of 240? Study the image if required.'),
      image('rId2', 3, 'Question diagram'),
      p('Answer Rules', 'Heading3'),
      answerRules('', '36', '0', 'No'),
      p('Explanation', 'Heading3'),
      p('0.15 multiplied by 240 equals 36.'),
      image('rId2', 4, 'Explanation diagram'),
      p('Question — ENG-WORD-001', 'Heading2'),
      p('Write one word meaning brief and clear.'),
      p('Answer Rules', 'Heading3'),
      answerRules('', 'concise|Concise', '', 'No'),
      p('Explanation', 'Heading3'),
      image('rId2', 5, 'Image-only explanation'),
    ].join('');
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr/></w:body></w:document>`;
    const stylesXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style></w:styles>';
    return this.createStoredZip([
      {
        name: '[Content_Types].xml',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
      },
      {
        name: '_rels/.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      },
      { name: 'word/document.xml', data: documentXml },
      { name: 'word/styles.xml', data: stylesXml },
      {
        name: 'word/_rels/document.xml.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/comprehension.png"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/question.png"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      },
      {
        name: 'word/media/comprehension.png',
        data: this.createSampleDiagramPng(false),
      },
      {
        name: 'word/media/question.png',
        data: this.createSampleDiagramPng(true),
      },
    ]);
  }

  private async subjectForUser(user: CurrentUser, id: number) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    this.assertOrganization(user, subject.organizationId);
    return subject;
  }

  private async ensureSubjectBelongsToOrganization(
    organizationId: number,
    subjectId?: number,
  ) {
    if (!subjectId) return;
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, organizationId, isActive: true },
      select: { id: true },
    });
    if (!subject)
      throw new BadRequestException(
        'Primary subject does not belong to this organization',
      );
  }

  private organizationId(user: CurrentUser, requested?: number) {
    if (user.organizationId) {
      if (requested && requested !== user.organizationId)
        throw new ForbiddenException(
          'Cross-organization access is not allowed',
        );
      return user.organizationId;
    }
    if (requested) return requested;
    throw new BadRequestException(
      'organizationId is required for a platform administrator',
    );
  }

  private assertOrganization(user: CurrentUser, organizationId: number) {
    if (user.organizationId && user.organizationId !== organizationId)
      throw new ForbiddenException('Cross-organization access is not allowed');
  }

  private validateQuestion(
    type: QuestionTypeCode,
    options?: Array<{ isCorrect: boolean }>,
    answers?: string[],
  ) {
    if (type === QUESTION_TYPE_CODES.SINGLE_CHOICE) {
      if (
        !options ||
        options.length < 2 ||
        options.filter((item) => item.isCorrect).length !== 1
      )
        throw new BadRequestException(
          'Single-choice questions require at least two options and exactly one correct option',
        );
      if (answers?.length)
        throw new BadRequestException(
          'Single-choice answers must be identified through options',
        );
    } else if (!answers?.length) {
      throw new BadRequestException(
        'Numeric and one-word questions require at least one accepted answer',
      );
    }
  }

  private validateStructure(dto: SaveTemplateStructureDto) {
    const slotCodes = dto.slots.map((item) => item.code.toUpperCase());
    if (new Set(slotCodes).size !== slotCodes.length)
      throw new BadRequestException('Slot codes must be unique');
    for (const slot of dto.slots) {
      const sectionCodes = slot.sections.map((item) => item.code.toUpperCase());
      if (new Set(sectionCodes).size !== sectionCodes.length)
        throw new BadRequestException(
          `Section codes must be unique inside slot ${slot.code}`,
        );
      const totalSectionTime = slot.sections.reduce(
        (total, section) => total + section.durationMinutes,
        0,
      );
      if (totalSectionTime > slot.durationMinutes)
        throw new BadRequestException(
          `Section timing exceeds slot timing for ${slot.code}`,
        );
      for (const section of slot.sections) {
        const available = section.subjects.reduce(
          (total, subject) => total + subject.questions.length,
          0,
        );
        if (
          section.questionsToAttempt &&
          section.questionsToAttempt > available
        )
          throw new BadRequestException(
            `questionsToAttempt exceeds available questions in ${section.code}`,
          );
      }
    }
  }

  private parseWorkbookMappings(buffer: Buffer): ExcelQuestionMapping[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new BadRequestException('The workbook has no worksheet');
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });
    if (!records.length)
      throw new BadRequestException('The Excel mapping contains no rows');
    return records.map((rawRecord, index) => {
      const record = this.normalizeRecord(rawRecord);
      const text = (key: string) => {
        const value = record[key];
        return typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
          ? String(value).trim()
          : '';
      };
      const numeric = (key: string, fallback?: number) => {
        const value = text(key);
        return value === '' ? fallback : Number(value);
      };
      const questionTypeId = numeric('question_type_id');
      const marks = numeric('marks', 1) ?? 1;
      const negativeMarks = numeric('negative_marks', 0) ?? 0;
      const sortOrder = numeric('sort_order');
      return {
        sourceRowNumber: index + 2,
        slotCode: text('slot_code').toUpperCase() || undefined,
        sectionCode: text('section_code').toUpperCase() || undefined,
        subjectCode: text('subject_code').toUpperCase() || undefined,
        questionCode: text('question_code').toUpperCase(),
        rawQuestionTypeId:
          questionTypeId !== undefined && Number.isInteger(questionTypeId)
            ? questionTypeId
            : undefined,
        comprehensionCode:
          text('comprehension_code').toUpperCase() || undefined,
        marks,
        negativeMarks,
        sortOrder:
          sortOrder !== undefined && Number.isInteger(sortOrder)
            ? sortOrder
            : undefined,
        isMandatory: this.booleanValue(record.is_mandatory, true),
        rawData: record,
      };
    });
  }

  private async parseWordContent(
    buffer: Buffer,
  ): Promise<WordQuestionContent[]> {
    const { value, messages } = await mammoth.convertToHtml(
      { buffer },
      { convertImage: mammoth.images.dataUri },
    );
    if (messages.some((message) => message.type === 'error'))
      throw new BadRequestException(
        'The Word content file could not be parsed',
      );
    const sanitizedHtml = this.sanitizeRichHtml(value);
    const structuredBlocks = this.topLevelHtmlBlocks(sanitizedHtml);
    const usesHeadingFormat = structuredBlocks.some(
      (block) => block.tag === 'h1' || block.tag === 'h2',
    );
    return usesHeadingFormat
      ? this.parseHeadingWordContent(structuredBlocks)
      : this.parseLegacyWordContent(sanitizedHtml);
  }

  private async parseCodelessWordContent(
    buffer: Buffer,
  ): Promise<CodelessWordQuestionContent[]> {
    const { value, messages } = await mammoth.convertToHtml(
      { buffer },
      { convertImage: mammoth.images.dataUri },
    );
    if (messages.some((message) => message.type === 'error'))
      throw new BadRequestException(
        'The Word content file could not be parsed',
      );
    const blocks = this.topLevelHtmlBlocks(this.sanitizeRichHtml(value));
    type SectionContext = {
      sectionTitle?: string;
      slotTitle?: string;
      subjectTitle?: string;
      sectionCode?: string;
      slotCode?: string;
      subjectCode?: string;
    };
    type PendingQuestion = {
      questionNumber: number;
      questionLabel: string;
      content: string[];
      options: Array<{ code: string; content: string; isCorrect: boolean }>;
      correctOption?: string;
      acceptedAnswers: string[];
      tolerance?: number;
      caseSensitive: boolean;
      explanation: string[];
      questionTypeLabel?: string;
      marks?: number;
      negativeMarks?: number;
      sortOrder?: number;
      isMandatory?: boolean;
      mode: 'question' | 'options' | 'answer-rules' | 'explanation';
      answerRulesSeen: boolean;
      explanationSeen: boolean;
      parseErrors: string[];
    };
    const rows: CodelessWordQuestionContent[] = [];
    let section: SectionContext | undefined;
    let comprehension:
      | { label: string; content: string[]; acceptingContent: boolean }
      | undefined;
    let question: PendingQuestion | undefined;

    const finishQuestion = () => {
      if (!question) return;
      question.options.forEach((option) => {
        option.isCorrect = option.code === question?.correctOption;
      });
      if (!question.answerRulesSeen)
        question.parseErrors.push('Answer Rules table is required');
      if (!question.explanationSeen)
        question.parseErrors.push('Explanation heading is required');
      rows.push({
        sourceRowNumber: rows.length + 1,
        ...section,
        questionNumber: question.questionNumber,
        questionLabel: question.questionLabel,
        comprehensionLabel: comprehension?.label,
        comprehensionContent:
          comprehension?.content.join('\n').trim() || undefined,
        questionContent: question.content.join('\n').trim(),
        answer: question.correctOption,
        tolerance: question.tolerance,
        caseSensitive: question.caseSensitive,
        explanation: question.explanation.join('\n').trim() || undefined,
        options: question.options,
        acceptedAnswers: question.acceptedAnswers,
        questionTypeLabel: question.questionTypeLabel,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        sortOrder: question.sortOrder,
        isMandatory: question.isMandatory,
        parseErrors: question.parseErrors,
        rawData: {
          source: 'word',
          format: 'CODELESS_HEADING_TABLE_V1',
          section,
          questionLabel: question.questionLabel,
          comprehensionLabel: comprehension?.label,
          parseErrors: question.parseErrors,
        },
      });
      question = undefined;
    };

    for (const block of blocks) {
      const metadata = this.parseCodelessSectionMetadata(block.text);
      if (metadata) {
        finishQuestion();
        section = metadata;
        comprehension = undefined;
        continue;
      }
      if (block.tag === 'h1') {
        finishQuestion();
        const comprehensionHeading = block.text.match(
          /^comprehension\s*(?:[\u2013\u2014:|-])\s*(.+)$/i,
        );
        if (comprehensionHeading) {
          comprehension = {
            label: comprehensionHeading[1].trim(),
            content: [],
            acceptingContent: true,
          };
        } else if (/^standalone questions?$/i.test(block.text)) {
          comprehension = undefined;
        } else if (block.text.trim()) {
          section = {
            sectionTitle: block.text.trim(),
            sectionCode: this.cleanImportCode(block.text),
          };
          comprehension = undefined;
        }
        continue;
      }
      if (block.tag === 'h2') {
        finishQuestion();
        const questionHeading = block.text.match(
          /^question\s*(?:[\u2013\u2014:|-])\s*(.+)$/i,
        );
        if (!questionHeading)
          throw new BadRequestException(
            `Unrecognized Question heading: ${block.text}`,
          );
        if (comprehension) comprehension.acceptingContent = false;
        const questionLabel = questionHeading[1].trim();
        const numberMatch = questionLabel.match(/\d+/);
        question = {
          questionNumber: numberMatch
            ? Number(numberMatch[0])
            : rows.length + 1,
          questionLabel,
          content: [],
          options: [],
          acceptedAnswers: [],
          caseSensitive: false,
          explanation: [],
          mode: 'question',
          answerRulesSeen: false,
          explanationSeen: false,
          parseErrors: numberMatch
            ? []
            : ['Question heading must contain a visible question number'],
        };
        continue;
      }
      if (block.tag === 'h3' && question) {
        const heading = block.text.trim().toLowerCase();
        if (heading === 'options') question.mode = 'options';
        else if (heading === 'answer rules') question.mode = 'answer-rules';
        else if (heading === 'explanation') {
          question.mode = 'explanation';
          question.explanationSeen = true;
        } else {
          question.parseErrors.push(
            `Unknown question subsection ${block.text}`,
          );
        }
        continue;
      }
      if (question) {
        if (question.mode === 'options' && block.tag === 'table') {
          for (const cells of this.tableRows(block.innerHtml)) {
            if (cells.length < 2) continue;
            const code = this.htmlText(cells[0])
              .replace(/^option\s*/i, '')
              .replace(/[:.)-]+$/g, '')
              .trim()
              .toUpperCase();
            if (!code) continue;
            question.options.push({
              code,
              content: cells[1].trim(),
              isCorrect: false,
            });
          }
        } else if (question.mode === 'answer-rules' && block.tag === 'table') {
          question.answerRulesSeen = true;
          const rules = new Map(
            this.tableRows(block.innerHtml)
              .filter((cells) => cells.length >= 2)
              .map((cells) => [
                this.htmlText(cells[0]).trim().toLowerCase(),
                this.htmlText(cells[1]).trim(),
              ]),
          );
          question.questionTypeLabel =
            rules.get('question type') || rules.get('type') || undefined;
          question.correctOption =
            rules.get('correct option')?.toUpperCase() || undefined;
          question.acceptedAnswers = (rules.get('accepted answers') ?? '')
            .split('|')
            .map((answer) => answer.trim())
            .filter(Boolean);
          const toleranceText = rules.get('numeric tolerance') ?? '';
          if (toleranceText) {
            const tolerance = Number(toleranceText);
            if (Number.isFinite(tolerance)) question.tolerance = tolerance;
            else
              question.parseErrors.push(
                'Numeric Tolerance must be a valid number',
              );
          }
          const marks = this.optionalNumberRule(rules.get('marks'));
          const negativeMarks = this.optionalNumberRule(
            rules.get('negative marks') ?? rules.get('negative_marks'),
          );
          const sortOrder = this.optionalIntegerRule(
            rules.get('sort order') ?? rules.get('sort_order'),
          );
          if (marks.invalid) question.parseErrors.push('Marks must be a number');
          else question.marks = marks.value;
          if (negativeMarks.invalid)
            question.parseErrors.push('Negative Marks must be a number');
          else question.negativeMarks = negativeMarks.value;
          if (sortOrder.invalid)
            question.parseErrors.push('Sort Order must be an integer');
          else question.sortOrder = sortOrder.value;
          const mandatoryText =
            rules.get('mandatory') ?? rules.get('is mandatory') ?? '';
          const mandatory = this.strictBooleanValue(mandatoryText);
          if (mandatory === undefined && mandatoryText)
            question.parseErrors.push('Mandatory must be Yes or No');
          question.isMandatory = mandatory ?? true;
          const caseSensitiveText = rules.get('case sensitive') ?? '';
          const caseSensitive = this.strictBooleanValue(caseSensitiveText);
          if (caseSensitive === undefined && caseSensitiveText)
            question.parseErrors.push('Case Sensitive must be Yes or No');
          question.caseSensitive = caseSensitive ?? false;
        } else if (question.mode === 'explanation') {
          question.explanation.push(block.html);
        } else if (question.mode === 'question') {
          question.content.push(block.html);
        }
      } else if (comprehension?.acceptingContent) {
        comprehension.content.push(block.html);
      }
    }
    finishQuestion();
    if (!rows.length)
      throw new BadRequestException(
        'No questions were found. Apply Heading 2 to headings such as Question - 1.',
      );
    return rows;
  }

  private parseHeadingWordContent(blocks: HtmlBlock[]): WordQuestionContent[] {
    type PendingQuestion = {
      code: string;
      content: string[];
      options: Array<{ code: string; content: string; isCorrect: boolean }>;
      correctOption?: string;
      acceptedAnswers: string[];
      tolerance?: number;
      caseSensitive: boolean;
      explanation: string[];
      mode: 'question' | 'options' | 'answer-rules' | 'explanation';
      answerRulesSeen: boolean;
      explanationSeen: boolean;
      parseErrors: string[];
    };
    const rows: WordQuestionContent[] = [];
    let comprehension:
      | { code: string; content: string[]; acceptingContent: boolean }
      | undefined;
    let question: PendingQuestion | undefined;

    const finishQuestion = () => {
      if (!question) return;
      question.options.forEach((option) => {
        option.isCorrect = option.code === question?.correctOption;
      });
      if (!question.answerRulesSeen)
        question.parseErrors.push('Answer Rules table is required');
      if (!question.explanationSeen)
        question.parseErrors.push('Explanation heading is required');
      rows.push({
        sourceRowNumber: rows.length + 1,
        questionCode: question.code.toUpperCase(),
        comprehensionCode: comprehension?.code.toUpperCase(),
        comprehensionContent:
          comprehension?.content.join('\n').trim() || undefined,
        questionContent: question.content.join('\n').trim(),
        answer: question.correctOption,
        tolerance: question.tolerance,
        caseSensitive: question.caseSensitive,
        explanation: question.explanation.join('\n').trim() || undefined,
        options: question.options,
        acceptedAnswers: question.acceptedAnswers,
        parseErrors: question.parseErrors,
        rawData: {
          source: 'word',
          format: 'HEADING_TABLE_V2',
          questionCode: question.code,
          parseErrors: question.parseErrors,
        },
      });
      question = undefined;
    };

    for (const block of blocks) {
      if (block.tag === 'h1') {
        finishQuestion();
        const comprehensionHeading = block.text.match(
          /^comprehension\s*(?:[\u2013\u2014:|-])\s*(.+)$/i,
        );
        if (comprehensionHeading) {
          comprehension = {
            code: comprehensionHeading[1].trim(),
            content: [],
            acceptingContent: true,
          };
        } else if (/^standalone questions?$/i.test(block.text)) {
          comprehension = undefined;
        } else {
          comprehension = undefined;
        }
        continue;
      }
      if (block.tag === 'h2') {
        finishQuestion();
        const questionHeading = block.text.match(
          /^question\s*(?:[\u2013\u2014:|-])\s*(.+)$/i,
        );
        if (!questionHeading)
          throw new BadRequestException(
            `Unrecognized Question heading: ${block.text}`,
          );
        if (comprehension) comprehension.acceptingContent = false;
        question = {
          code: questionHeading[1].trim(),
          content: [],
          options: [],
          acceptedAnswers: [],
          caseSensitive: false,
          explanation: [],
          mode: 'question',
          answerRulesSeen: false,
          explanationSeen: false,
          parseErrors: [],
        };
        continue;
      }
      if (block.tag === 'h3' && question) {
        const heading = block.text.trim().toLowerCase();
        if (heading === 'options') question.mode = 'options';
        else if (heading === 'answer rules') question.mode = 'answer-rules';
        else if (heading === 'explanation') {
          question.mode = 'explanation';
          question.explanationSeen = true;
        } else {
          question.parseErrors.push(
            `Unknown question subsection ${block.text}`,
          );
        }
        continue;
      }
      if (question) {
        if (question.mode === 'options' && block.tag === 'table') {
          const optionRows = this.tableRows(block.innerHtml);
          for (const cells of optionRows) {
            if (cells.length < 2) continue;
            const code = this.htmlText(cells[0])
              .replace(/^option\s*/i, '')
              .replace(/[:.)-]+$/g, '')
              .trim()
              .toUpperCase();
            if (!code) continue;
            question.options.push({
              code,
              content: cells[1].trim(),
              isCorrect: false,
            });
          }
        } else if (question.mode === 'answer-rules' && block.tag === 'table') {
          question.answerRulesSeen = true;
          const rules = new Map(
            this.tableRows(block.innerHtml)
              .filter((cells) => cells.length >= 2)
              .map((cells) => [
                this.htmlText(cells[0]).trim().toLowerCase(),
                this.htmlText(cells[1]).trim(),
              ]),
          );
          question.correctOption =
            rules.get('correct option')?.toUpperCase() || undefined;
          question.acceptedAnswers = (rules.get('accepted answers') ?? '')
            .split('|')
            .map((answer) => answer.trim())
            .filter(Boolean);
          const toleranceText = rules.get('numeric tolerance') ?? '';
          if (toleranceText) {
            const tolerance = Number(toleranceText);
            if (Number.isFinite(tolerance)) question.tolerance = tolerance;
            else
              question.parseErrors.push(
                'Numeric Tolerance must be a valid number',
              );
          }
          const caseSensitiveText = rules.get('case sensitive') ?? '';
          const caseSensitive = this.strictBooleanValue(caseSensitiveText);
          if (caseSensitive === undefined && caseSensitiveText)
            question.parseErrors.push('Case Sensitive must be Yes or No');
          question.caseSensitive = caseSensitive ?? false;
        } else if (question.mode === 'explanation') {
          question.explanation.push(block.html);
        } else if (question.mode === 'question') {
          question.content.push(block.html);
        }
      } else if (comprehension?.acceptingContent) {
        comprehension.content.push(block.html);
      }
    }
    finishQuestion();
    if (!rows.length)
      throw new BadRequestException(
        'No questions were found. Apply Heading 2 to headings such as Question — ENG-001.',
      );
    return rows;
  }

  private parseLegacyWordContent(value: string): WordQuestionContent[] {
    const blocks = value
      .replace(/<\/(?:p|h[1-6]|li|tr|div)>/gi, (match) => `${match}\n`)
      .split(/\r?\n/)
      .map((html) => html.trim())
      .filter(Boolean);
    const rows: WordQuestionContent[] = [];
    let comprehension:
      { code: string; content: string; collecting: boolean } | undefined;
    let question:
      | {
          code: string;
          content: string[];
          options: Array<{ code: string; content: string; isCorrect: boolean }>;
          correctOption?: string;
          acceptedAnswers: string[];
          tolerance?: number;
          caseSensitive: boolean;
          explanation?: string;
          activeField?:
            { kind: 'option'; code: string } | { kind: 'explanation' };
        }
      | undefined;

    const finishQuestion = () => {
      if (!question) return;
      question.options.forEach((option) => {
        option.isCorrect = option.code === question?.correctOption;
      });
      rows.push({
        sourceRowNumber: rows.length + 1,
        questionCode: question.code.toUpperCase(),
        comprehensionCode: comprehension?.code.toUpperCase(),
        comprehensionContent: comprehension?.content || undefined,
        questionContent: question.content.join('\n').trim(),
        answer: question.correctOption,
        tolerance: question.tolerance,
        caseSensitive: question.caseSensitive,
        explanation: question.explanation,
        options: question.options,
        acceptedAnswers: question.acceptedAnswers,
        rawData: {
          source: 'word',
          format: 'LEGACY_MARKERS_V1',
          questionCode: question.code,
        },
      });
      question = undefined;
    };

    for (const html of blocks) {
      const plain = this.htmlText(html);
      const comprehensionStart = plain.match(
        /^\[COMPREHENSION:\s*([^\]]+)\]$/i,
      );
      const questionStart = plain.match(/^\[QUESTION:\s*([^\]]+)\]$/i);
      if (comprehensionStart) {
        finishQuestion();
        comprehension = {
          code: comprehensionStart[1].trim(),
          content: '',
          collecting: true,
        };
      } else if (/^\[END_COMPREHENSION\]$/i.test(plain)) {
        if (comprehension) comprehension.collecting = false;
      } else if (/^\[END_COMPREHENSION_GROUP\]$/i.test(plain)) {
        finishQuestion();
        comprehension = undefined;
      } else if (questionStart) {
        finishQuestion();
        question = {
          code: questionStart[1].trim(),
          content: [],
          options: [],
          acceptedAnswers: [],
          caseSensitive: false,
        };
      } else if (/^\[END_QUESTION\]$/i.test(plain)) {
        finishQuestion();
      } else if (comprehension?.collecting && !question) {
        comprehension.content = [comprehension.content, html]
          .filter(Boolean)
          .join('\n');
      } else if (question) {
        const option = plain.match(/^OPTION_([A-Z0-9]+)\s*:\s*(.*)$/i);
        const correct = plain.match(/^CORRECT_OPTION\s*:\s*(.*)$/i);
        const answers = plain.match(/^ACCEPTED_ANSWERS\s*:\s*(.*)$/i);
        const tolerance = plain.match(/^NUMERIC_TOLERANCE\s*:\s*(.*)$/i);
        const caseSensitive = plain.match(/^CASE_SENSITIVE\s*:\s*(.*)$/i);
        const explanation = plain.match(/^EXPLANATION\s*:\s*(.*)$/i);
        if (option) {
          question.options.push({
            code: option[1].toUpperCase(),
            content: this.richFieldContent(html, option[2].trim()),
            isCorrect: false,
          });
          question.activeField = {
            kind: 'option',
            code: option[1].toUpperCase(),
          };
        } else if (correct) {
          question.correctOption = correct[1].trim().toUpperCase() || undefined;
          question.activeField = undefined;
        } else if (answers) {
          question.acceptedAnswers = answers[1]
            .split('|')
            .map((answer) => answer.trim())
            .filter(Boolean);
          question.activeField = undefined;
        } else if (tolerance) {
          const parsed = Number(tolerance[1]);
          question.tolerance =
            tolerance[1].trim() && Number.isFinite(parsed) ? parsed : undefined;
          question.activeField = undefined;
        } else if (caseSensitive) {
          question.caseSensitive = this.booleanValue(caseSensitive[1], false);
          question.activeField = undefined;
        } else if (explanation) {
          question.explanation =
            this.richFieldContent(html, explanation[1].trim()) || undefined;
          question.activeField = { kind: 'explanation' };
        } else if (question.activeField?.kind === 'option') {
          const activeCode = question.activeField.code;
          const activeOption = question.options.find(
            (item) => item.code === activeCode,
          );
          if (activeOption)
            activeOption.content = [activeOption.content, html]
              .filter(Boolean)
              .join('\n');
        } else if (question.activeField?.kind === 'explanation') {
          question.explanation = [question.explanation, html]
            .filter(Boolean)
            .join('\n');
        } else {
          question.content.push(html);
        }
      }
    }
    finishQuestion();
    if (!rows.length)
      throw new BadRequestException(
        'No Word questions were found. Use [QUESTION: CODE] and [END_QUESTION] markers.',
      );
    return rows;
  }

  private normalizeRecord(record: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(record).map(([key, value]) => [
        key
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '_'),
        value,
      ]),
    );
  }

  private parseCodelessSectionMetadata(value: string) {
    const text = value.trim();
    if (!text) return undefined;
    if (!text.includes('|') && !/^(slot|section|subject)\s*:/i.test(text))
      return undefined;
    const metadata: {
      sectionTitle?: string;
      slotTitle?: string;
      subjectTitle?: string;
      sectionCode?: string;
      slotCode?: string;
      subjectCode?: string;
    } = {};
    for (const [index, rawPart] of text.split('|').entries()) {
      const part = rawPart.trim();
      if (!part) continue;
      const field = part.match(/^(slot|section|subject)\s*:\s*(.+)$/i);
      if (!field && index === 0) {
        metadata.sectionTitle = part;
        continue;
      }
      if (!field) continue;
      const key = field[1].trim().toLowerCase();
      const fieldValue = field[2].trim();
      if (key === 'slot') {
        metadata.slotTitle = fieldValue;
        metadata.slotCode = this.cleanImportCode(fieldValue);
      } else if (key === 'section') {
        metadata.sectionTitle ??= fieldValue;
        metadata.sectionCode = this.cleanImportCode(fieldValue);
      } else {
        metadata.subjectTitle = fieldValue;
        metadata.subjectCode = this.cleanImportCode(fieldValue);
      }
    }
    return metadata.sectionTitle ||
      metadata.sectionCode ||
      metadata.slotTitle ||
      metadata.subjectTitle
      ? metadata
      : undefined;
  }

  private optionalNumberRule(value?: string) {
    if (!value?.trim()) return { value: undefined, invalid: false };
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? { value: parsed, invalid: false }
      : { value: undefined, invalid: true };
  }

  private optionalIntegerRule(value?: string) {
    if (!value?.trim()) return { value: undefined, invalid: false };
    const parsed = Number(value);
    return Number.isInteger(parsed)
      ? { value: parsed, invalid: false }
      : { value: undefined, invalid: true };
  }

  private resolveCodelessDestination(
    structure: Array<{
      code: string;
      name: string;
      sections: Array<{
        code: string;
        name: string;
        subjects: Array<{
          subject: {
            id: number;
            organizationId: number;
            code: string;
            name: string;
          };
        }>;
      }>;
    }>,
    word: CodelessWordQuestionContent,
  ) {
    const slot =
      structure.find((item) =>
        this.matchesTemplateText(item, word.slotCode, word.slotTitle),
      ) ?? (structure.length === 1 ? structure[0] : undefined);
    const sectionPool = slot
      ? slot.sections
      : structure.flatMap((item) => item.sections);
    const section = sectionPool.find((item) =>
      this.matchesTemplateText(item, word.sectionCode, word.sectionTitle),
    );
    const resolvedSlot =
      slot ??
      (section
        ? structure.find((item) =>
            item.sections.some(
              (sectionItem) => sectionItem.code === section.code,
            ),
          )
        : undefined);
    const subjectPool = section?.subjects ?? [];
    const subject =
      subjectPool.find((item) =>
        this.matchesTemplateText(
          item.subject,
          word.subjectCode,
          word.subjectTitle,
        ),
      )?.subject ??
      (subjectPool.length === 1 ? subjectPool[0].subject : undefined);
    return { slot: resolvedSlot, section, subject };
  }

  private matchesTemplateText(
    item: { code: string; name: string },
    code?: string,
    title?: string,
  ) {
    const itemCode = item.code.trim().toUpperCase();
    const itemName = this.normalizeLookupKey(item.name);
    return (
      Boolean(code && itemCode === code.trim().toUpperCase()) ||
      Boolean(title && itemName === this.normalizeLookupKey(title)) ||
      Boolean(title && itemCode === this.cleanImportCode(title))
    );
  }

  private resolveCodelessQuestionType(
    word: CodelessWordQuestionContent,
    typeByCode: Map<string, { id: number; code: string; name: string }>,
  ) {
    const label = this.normalizeLookupKey(word.questionTypeLabel ?? '');
    const code = [
      'singlechoice',
      'singleanswer',
      'singlecorrect',
      'mcq',
      'multiplechoice',
    ].includes(label)
      ? QUESTION_TYPE_CODES.SINGLE_CHOICE
      : ['numeric', 'numericanswer', 'number'].includes(label)
        ? QUESTION_TYPE_CODES.NUMERIC
        : ['oneword', 'onewordanswer', 'shortanswer', 'text'].includes(label)
          ? QUESTION_TYPE_CODES.ONE_WORD
          : undefined;
    if (code) return typeByCode.get(code);
    if (word.options.length)
      return typeByCode.get(QUESTION_TYPE_CODES.SINGLE_CHOICE);
    if (
      word.acceptedAnswers.length &&
      word.acceptedAnswers.every((answer) => Number.isFinite(Number(answer)))
    )
      return typeByCode.get(QUESTION_TYPE_CODES.NUMERIC);
    if (word.acceptedAnswers.length)
      return typeByCode.get(QUESTION_TYPE_CODES.ONE_WORD);
    return undefined;
  }

  private codelessComprehensionCode(
    existing: Map<string, string>,
    nextIndex: number,
    sectionPrefix: string,
    label: string,
  ) {
    const key = `${sectionPrefix}:${this.normalizeLookupKey(label)}`;
    const current = existing.get(key);
    if (current) return current;
    const code = `${sectionPrefix}-COMP-${String(nextIndex).padStart(3, '0')}`;
    existing.set(key, code);
    return code;
  }

  private cleanImportCode(value: string) {
    return this.htmlText(value)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
  }

  private normalizeLookupKey(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private mergeImportFiles(
    wordRows: WordQuestionContent[],
    excelRows: ExcelQuestionMapping[],
    questionTypes: Array<{ id: number; code: string }>,
  ): StagedRow[] {
    const wordByCode = new Map<string, WordQuestionContent[]>();
    const excelByCode = new Map<string, ExcelQuestionMapping[]>();
    for (const row of wordRows) {
      const bucket = wordByCode.get(row.questionCode) ?? [];
      bucket.push(row);
      wordByCode.set(row.questionCode, bucket);
    }
    for (const row of excelRows) {
      const bucket = excelByCode.get(row.questionCode) ?? [];
      bucket.push(row);
      excelByCode.set(row.questionCode, bucket);
    }
    const codes = [...new Set([...wordByCode.keys(), ...excelByCode.keys()])];
    const typeById = new Map(questionTypes.map((type) => [type.id, type]));
    return codes.map((code, index) => {
      const words = wordByCode.get(code) ?? [];
      const mappings = excelByCode.get(code) ?? [];
      const word = words[0];
      const mapping = mappings[0];
      const type = mapping?.rawQuestionTypeId
        ? typeById.get(mapping.rawQuestionTypeId)
        : undefined;
      const errors: string[] = [...(word?.parseErrors ?? [])];
      if (!code) errors.push('question_code is required in both files');
      if (!word) errors.push('question_code is missing from the Word file');
      if (!mapping) errors.push('question_code is missing from the Excel file');
      if (words.length > 1) errors.push('duplicate question_code in Word');
      if (mappings.length > 1) errors.push('duplicate question_code in Excel');
      if (!mapping?.rawQuestionTypeId)
        errors.push('question_type_id must be an integer');
      else if (!type)
        errors.push(
          `unknown or inactive question_type_id ${mapping.rawQuestionTypeId}`,
        );
      if (!word || !this.hasRichContent(word.questionContent))
        errors.push('Word question content is required');
      if (
        word?.comprehensionCode &&
        !this.hasRichContent(word.comprehensionContent ?? '')
      )
        errors.push('Comprehension content must contain text or an image');
      if (!Number.isFinite(mapping?.marks) || (mapping?.marks ?? -1) < 0)
        errors.push('marks must be a non-negative number');
      if (
        !Number.isFinite(mapping?.negativeMarks) ||
        (mapping?.negativeMarks ?? -1) < 0
      )
        errors.push('negative_marks must be a non-negative number');
      if (
        word &&
        mapping &&
        (word.comprehensionCode ?? '') !== (mapping.comprehensionCode ?? '')
      )
        errors.push('comprehension_code differs between Word and Excel');
      if (word) {
        const optionCodes = word.options.map((option) => option.code);
        if (new Set(optionCodes).size !== optionCodes.length)
          errors.push('option codes must be unique');
        if (word.options.some((option) => !this.hasRichContent(option.content)))
          errors.push('every option must contain text or an image');
      }
      if (type?.code === QUESTION_TYPE_CODES.SINGLE_CHOICE) {
        if (
          !word ||
          word.options.length < 2 ||
          word.options.filter((option) => option.isCorrect).length !== 1
        )
          errors.push(
            'single-answer requires at least two options and one Correct Option value in Word',
          );
        if (
          word?.answer &&
          !word.options.some((option) => option.code === word.answer)
        )
          errors.push('Correct Option must reference an option-table code');
      } else if (type?.code === QUESTION_TYPE_CODES.NUMERIC) {
        if (!word?.acceptedAnswers.length)
          errors.push('numeric questions require Accepted Answers in Word');
        if (
          word?.acceptedAnswers.some(
            (answer) => !Number.isFinite(Number(answer)),
          )
        )
          errors.push('numeric accepted answers must be valid numbers');
        if ((word?.tolerance ?? 0) < 0)
          errors.push('Numeric Tolerance cannot be negative');
      } else if (
        type?.code === QUESTION_TYPE_CODES.ONE_WORD &&
        !word?.acceptedAnswers.length
      ) {
        errors.push('one-word questions require Accepted Answers in Word');
      }
      return {
        sourceRowNumber: index + 1,
        slotCode: mapping?.slotCode,
        sectionCode: mapping?.sectionCode,
        subjectCode: mapping?.subjectCode,
        questionCode: code,
        questionTypeId: type?.id,
        rawQuestionTypeId: mapping?.rawQuestionTypeId,
        comprehensionCode:
          word?.comprehensionCode ?? mapping?.comprehensionCode,
        comprehensionContent: word?.comprehensionContent,
        questionContent: word?.questionContent ?? '',
        marks: mapping?.marks ?? 0,
        negativeMarks: mapping?.negativeMarks ?? 0,
        sortOrder: mapping?.sortOrder,
        isMandatory: mapping?.isMandatory ?? true,
        answer: word?.answer,
        tolerance: word?.tolerance,
        caseSensitive: word?.caseSensitive ?? false,
        explanation: word?.explanation,
        options: word?.options ?? [],
        acceptedAnswers: word?.acceptedAnswers ?? [],
        status: errors.length
          ? ExamImportRowStatus.ERROR
          : ExamImportRowStatus.VALID,
        validationMessage: errors.join('; ') || undefined,
        rawData: {
          word: word?.rawData ?? null,
          excel: mapping?.rawData ?? null,
        },
      };
    });
  }

  private async buildCodelessWordRows(
    buffer: Buffer,
    versionId: number,
    dto: CreateExamImportDto,
    questionTypes: Array<{ id: number; code: string; name: string }>,
  ): Promise<StagedRow[]> {
    const wordRows = await this.parseCodelessWordContent(buffer);
    const structure = await this.prisma.examTemplateSlot.findMany({
      where: { examTemplateVersionId: versionId },
      orderBy: { sortOrder: 'asc' },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: { subjects: { include: { subject: true } } },
        },
      },
    });
    const typeByCode = new Map(
      questionTypes.map((type) => [type.code.toUpperCase(), type]),
    );
    const selectedSlot =
      dto.scope === ExamImportScope.SINGLE_SECTION
        ? structure.find((slot) =>
            slot.sections.some(
              (section) => section.id === dto.examTemplateSectionId,
            ),
          )
        : undefined;
    const selectedSection = selectedSlot?.sections.find(
      (section) => section.id === dto.examTemplateSectionId,
    );
    const selectedSubject = selectedSection?.subjects[0]?.subject;
    const orderByDestination = new Map<string, number>();
    const comprehensionCodes = new Map<string, string>();
    let comprehensionIndex = 0;

    return wordRows.map((word) => {
      const destination =
        dto.scope === ExamImportScope.SINGLE_SECTION
          ? {
              slot: selectedSlot,
              section: selectedSection,
              subject: selectedSubject,
            }
          : this.resolveCodelessDestination(structure, word);
      const fallbackPrefix = this.cleanImportCode(
        word.sectionCode ?? word.sectionTitle ?? 'SECTION',
      );
      const sectionPrefix =
        destination.section?.code.toUpperCase() || fallbackPrefix || 'SECTION';
      const questionCode = `${sectionPrefix}-Q${String(
        word.questionNumber,
      ).padStart(3, '0')}`;
      const destinationKey = [
        destination.slot?.code ?? word.slotCode ?? '',
        destination.section?.code ?? word.sectionCode ?? '',
      ].join(':');
      const sortOrder = word.sortOrder ?? orderByDestination.get(destinationKey) ?? 1;
      orderByDestination.set(destinationKey, sortOrder + 1);
      const type = this.resolveCodelessQuestionType(
        word,
        typeByCode,
      );
      const errors: string[] = [...(word.parseErrors ?? [])];
      if (
        dto.scope === ExamImportScope.FULL_EXAM &&
        !word.sectionTitle &&
        !word.sectionCode
      )
        errors.push('Section heading or metadata is required');
      if (!type)
        errors.push(
          'Question Type must be Single Choice, Numeric, or One Word',
        );
      if (!this.hasRichContent(word.questionContent))
        errors.push('Word question content is required');
      if (
        word.comprehensionLabel &&
        !this.hasRichContent(word.comprehensionContent ?? '')
      )
        errors.push('Comprehension content must contain text or an image');
      if (!Number.isFinite(word.marks ?? 1) || (word.marks ?? 1) < 0)
        errors.push('Marks must be a non-negative number');
      if (
        !Number.isFinite(word.negativeMarks ?? 0) ||
        (word.negativeMarks ?? 0) < 0
      )
        errors.push('Negative Marks must be a non-negative number');
      const optionCodes = word.options.map((option) => option.code);
      if (new Set(optionCodes).size !== optionCodes.length)
        errors.push('Option labels must be unique');
      if (word.options.some((option) => !this.hasRichContent(option.content)))
        errors.push('Every option must contain text or an image');
      if (type?.code === QUESTION_TYPE_CODES.SINGLE_CHOICE) {
        if (
          word.options.length < 2 ||
          word.options.filter((option) => option.isCorrect).length !== 1
        )
          errors.push(
            'Single-choice questions require at least two options and one Correct Option value',
          );
        if (
          word.answer &&
          !word.options.some((option) => option.code === word.answer)
        )
          errors.push('Correct Option must reference an option-table label');
      } else if (type?.code === QUESTION_TYPE_CODES.NUMERIC) {
        if (!word.acceptedAnswers.length)
          errors.push('Numeric questions require Accepted Answers');
        if (
          word.acceptedAnswers.some(
            (answer) => !Number.isFinite(Number(answer)),
          )
        )
          errors.push('Numeric accepted answers must be valid numbers');
        if ((word.tolerance ?? 0) < 0)
          errors.push('Numeric Tolerance cannot be negative');
      } else if (
        type?.code === QUESTION_TYPE_CODES.ONE_WORD &&
        !word.acceptedAnswers.length
      ) {
        errors.push('One-word questions require Accepted Answers');
      }
      const comprehensionCode = word.comprehensionLabel
        ? this.codelessComprehensionCode(
            comprehensionCodes,
            ++comprehensionIndex,
            sectionPrefix,
            word.comprehensionLabel,
          )
        : undefined;
      return {
        sourceRowNumber: word.sourceRowNumber,
        slotCode: destination.slot?.code ?? word.slotCode,
        sectionCode: destination.section?.code ?? word.sectionCode,
        subjectCode: destination.subject?.code ?? word.subjectCode,
        questionCode,
        questionTypeId: type?.id,
        rawQuestionTypeId: type?.id,
        comprehensionCode,
        comprehensionContent: word.comprehensionContent,
        questionContent: word.questionContent,
        marks: word.marks ?? 1,
        negativeMarks: word.negativeMarks ?? 0,
        sortOrder,
        isMandatory: word.isMandatory ?? true,
        answer: word.answer,
        tolerance: word.tolerance,
        caseSensitive: word.caseSensitive,
        explanation: word.explanation,
        options: word.options,
        acceptedAnswers: word.acceptedAnswers,
        status: errors.length
          ? ExamImportRowStatus.ERROR
          : ExamImportRowStatus.VALID,
        validationMessage: errors.join('; ') || undefined,
        rawData: {
          word: word.rawData,
          importMode: ExamImportMode.CODELESS_WORD,
          generated: {
            questionCode,
            comprehensionCode,
            sectionPrefix,
          },
        },
      };
    });
  }

  private async validateImportDestinations(
    versionId: number,
    organizationId: number,
    dto: CreateExamImportDto,
    rows: StagedRow[],
  ) {
    const structure = await this.prisma.examTemplateSlot.findMany({
      where: { examTemplateVersionId: versionId },
      include: {
        sections: {
          include: { subjects: { include: { subject: true } } },
        },
      },
    });
    const subjects = await this.prisma.subject.findMany({
      where: { organizationId, isActive: true },
    });
    const existingQuestions = await this.prisma.question.findMany({
      where: {
        organizationId,
        code: { in: rows.map((row) => row.questionCode).filter(Boolean) },
      },
      select: { code: true, subjectId: true },
    });
    const subjectCodes = new Map(
      subjects.map((subject) => [subject.code.toUpperCase(), subject.id]),
    );
    const existingQuestionCodes = new Map(
      existingQuestions.map((question) => [
        question.code.toUpperCase(),
        question.subjectId,
      ]),
    );
    const selectedSlot =
      dto.scope === ExamImportScope.SINGLE_SECTION
        ? structure.find((item) =>
            item.sections.some(
              (section) => section.id === dto.examTemplateSectionId,
            ),
          )
        : undefined;
    const selectedSection = selectedSlot?.sections.find(
      (section) => section.id === dto.examTemplateSectionId,
    );
    const selectedSubject = selectedSection?.subjects[0]?.subject;
    const seen = new Set<string>();
    for (const row of rows) {
      const errors = row.validationMessage ? [row.validationMessage] : [];
      const questionCode = row.questionCode.toUpperCase();
      if (seen.has(questionCode))
        errors.push('duplicate question_code in this file');
      seen.add(questionCode);
      const existingSubjectId = existingQuestionCodes.get(questionCode);
      const intendedSubjectId =
        dto.scope === ExamImportScope.SINGLE_SECTION
          ? dto.subjectId
          : subjectCodes.get(row.subjectCode?.trim().toUpperCase() ?? '');
      if (existingSubjectId !== undefined)
        errors.push(
          existingSubjectId === intendedSubjectId
            ? `question_code ${row.questionCode} already exists in the question bank; imports only create new questions`
            : `question_code ${row.questionCode} already belongs to another subject`,
        );
      if (dto.scope === ExamImportScope.FULL_EXAM) {
        const slot = structure.find(
          (item) =>
            item.code.toUpperCase() === row.slotCode?.trim().toUpperCase(),
        );
        const section = slot?.sections.find(
          (item) =>
            item.code.toUpperCase() === row.sectionCode?.trim().toUpperCase(),
        );
        if (!slot) errors.push(`unknown slot_code ${row.slotCode ?? ''}`);
        if (!section)
          errors.push(`unknown section_code ${row.sectionCode ?? ''}`);
        if (
          !row.subjectCode ||
          !subjectCodes.has(row.subjectCode.trim().toUpperCase())
        )
          errors.push(`unknown subject_code ${row.subjectCode ?? ''}`);
        if (section && section.subjects.length !== 1)
          errors.push(
            `section ${section.code} must contain exactly one subject`,
          );
        else if (
          section &&
          section.subjects[0].subject.code.toUpperCase() !==
            row.subjectCode?.trim().toUpperCase()
        )
          errors.push(
            `subject_code must be ${section.subjects[0].subject.code.toUpperCase()} for section ${section.code}`,
          );
      } else {
        if (
          !selectedSlot ||
          !selectedSection ||
          (dto.examTemplateSlotId && selectedSlot.id !== dto.examTemplateSlotId)
        )
          errors.push(
            'target section does not belong to this template version/slot',
          );
        if (!selectedSection || selectedSection.subjects.length !== 1)
          errors.push('target section must contain exactly one subject');
        if (
          !selectedSubject ||
          selectedSubject.organizationId !== organizationId ||
          selectedSubject.id !== dto.subjectId
        )
          errors.push('target subject does not belong to this organization');
        if (
          selectedSlot &&
          row.slotCode?.trim().toUpperCase() !== selectedSlot.code.toUpperCase()
        )
          errors.push(
            `slot_code must be ${selectedSlot.code.toUpperCase()} for the selected section`,
          );
        if (
          selectedSection &&
          row.sectionCode?.trim().toUpperCase() !==
            selectedSection.code.toUpperCase()
        )
          errors.push(
            `section_code must be ${selectedSection.code.toUpperCase()} for the selected destination`,
          );
        if (
          selectedSubject &&
          row.subjectCode?.trim().toUpperCase() !==
            selectedSubject.code.toUpperCase()
        )
          errors.push(
            `subject_code must be ${selectedSubject.code.toUpperCase()} for section ${selectedSection?.code.toUpperCase() ?? ''}`,
          );
      }
      if (errors.length) {
        row.status = ExamImportRowStatus.ERROR;
        row.validationMessage = errors.join('; ');
      }
    }
  }

  private async resolveImportDestination(
    tx: Prisma.TransactionClient,
    job: ImportJobWithRows,
    row: ImportJobWithRows['rows'][number],
  ) {
    if (job.scope === ExamImportScope.SINGLE_SECTION) {
      const section = await tx.examTemplateSection.findFirst({
        where: {
          id: job.examTemplateSectionId ?? undefined,
          examTemplateSlot: {
            id: job.examTemplateSlotId ?? undefined,
            examTemplateVersionId: job.examTemplateVersionId,
          },
        },
        include: {
          examTemplateSlot: true,
          subjects: { include: { subject: true } },
        },
      });
      const subject = section?.subjects[0]?.subject;
      if (
        !section ||
        section.subjects.length !== 1 ||
        !subject ||
        subject.id !== job.subjectId ||
        subject.organizationId !== job.organizationId ||
        section.examTemplateSlot.code.toUpperCase() !==
          row.slotCode?.trim().toUpperCase() ||
        section.code.toUpperCase() !== row.sectionCode?.trim().toUpperCase() ||
        subject.code.toUpperCase() !== row.subjectCode?.trim().toUpperCase()
      )
        throw new BadRequestException(
          `Import destination does not match the selected section for row ${row.sourceIndex}`,
        );
      return {
        sectionId: section.id,
        subjectId: subject.id,
      };
    }
    const slot = await tx.examTemplateSlot.findFirst({
      where: {
        examTemplateVersionId: job.examTemplateVersionId,
        code: row.slotCode!,
      },
    });
    const section = slot
      ? await tx.examTemplateSection.findFirst({
          where: { examTemplateSlotId: slot.id, code: row.sectionCode! },
          include: { subjects: true },
        })
      : null;
    const subject = await tx.subject.findFirst({
      where: { organizationId: job.organizationId, code: row.subjectCode! },
    });
    if (
      !section ||
      !subject ||
      section.subjects.length !== 1 ||
      section.subjects[0].subjectId !== subject.id
    )
      throw new BadRequestException(
        `Import destination no longer exists for row ${row.sourceIndex}`,
      );
    return { sectionId: section.id, subjectId: subject.id };
  }

  private importCounts(rows: StagedRow[]) {
    return {
      totalRows: rows.length,
      validRows: rows.filter((row) => row.status === ExamImportRowStatus.VALID)
        .length,
      warningRows: rows.filter(
        (row) => row.status === ExamImportRowStatus.WARNING,
      ).length,
      errorRows: rows.filter((row) => row.status === ExamImportRowStatus.ERROR)
        .length,
    };
  }

  private booleanValue(value: unknown, fallback: boolean) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
    if (['false', 'no', 'n', '0'].includes(normalized)) return false;
    return fallback;
  }

  private strictBooleanValue(value: string) {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
    if (['false', 'no', 'n', '0'].includes(normalized)) return false;
    return undefined;
  }

  private sanitizeRichHtml(value: string) {
    const allowed = new Set([
      'p',
      'br',
      'strong',
      'em',
      'u',
      'ol',
      'ul',
      'li',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
      'h1',
      'h2',
      'h3',
      'sub',
      'sup',
      'img',
    ]);
    return value
      .replace(/<!--([\s\S]*?)-->/g, '')
      .replace(
        /<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi,
        '',
      )
      .replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (tag, rawName, attributes) => {
        const name = String(rawName).toLowerCase();
        if (!allowed.has(name)) return '';
        if (tag.startsWith('</')) return `</${name}>`;
        if (name === 'img') {
          const source = String(attributes).match(
            /\bsrc\s*=\s*["'](data:image\/(?:png|jpeg|jpg|gif|webp);base64,[a-z0-9+/=\s]+)["']/i,
          )?.[1];
          if (!source) return '';
          const alt = String(attributes).match(
            /\balt\s*=\s*["']([^"']*)["']/i,
          )?.[1];
          return `<img src="${source.replace(/\s/g, '')}"${alt ? ` alt="${this.escapeXml(alt)}"` : ''}>`;
        }
        return name === 'br' ? '<br>' : `<${name}>`;
      });
  }

  private topLevelHtmlBlocks(value: string): HtmlBlock[] {
    const blocks: HtmlBlock[] = [];
    const tags = /<\/?([a-z0-9]+)\b[^>]*>/gi;
    const voidTags = new Set(['img', 'br']);
    let depth = 0;
    let start = -1;
    let rootTag = '';
    let match: RegExpExecArray | null;
    while ((match = tags.exec(value))) {
      const tag = match[1].toLowerCase();
      const closing = match[0].startsWith('</');
      if (!closing && depth === 0) {
        start = match.index;
        rootTag = tag;
      }
      if (!voidTags.has(tag)) depth += closing ? -1 : 1;
      if ((voidTags.has(tag) && depth === 0) || (closing && depth === 0)) {
        const html = value.slice(start, tags.lastIndex).trim();
        if (html) {
          const innerHtml = voidTags.has(rootTag)
            ? html
            : html
                .replace(new RegExp(`^<${rootTag}[^>]*>`, 'i'), '')
                .replace(new RegExp(`</${rootTag}>$`, 'i'), '');
          blocks.push({
            tag: rootTag,
            html,
            innerHtml,
            text: this.htmlText(innerHtml),
          });
        }
        start = -1;
        rootTag = '';
      }
    }
    return blocks;
  }

  private tableRows(value: string) {
    return [...value.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map((row) =>
      [...row[1].matchAll(/<t[dh]>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
        cell[1].trim(),
      ),
    );
  }

  private htmlText(value: string) {
    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .trim();
  }

  private hasRichContent(value: string) {
    return this.htmlText(value).length > 0 || /<img\b[^>]*>/i.test(value);
  }

  private richFieldContent(html: string, plainValue: string) {
    return /<img\b/i.test(html) ? html : plainValue;
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private createSampleDiagramPng(variant: boolean) {
    const width = 480;
    const height = 220;
    const stride = width * 4 + 1;
    const raw = Buffer.alloc(stride * height, 255);
    for (let y = 0; y < height; y += 1) raw[y * stride] = 0;
    const rectangle = (
      x: number,
      y: number,
      boxWidth: number,
      boxHeight: number,
      color: [number, number, number, number],
    ) => {
      for (let row = y; row < y + boxHeight; row += 1) {
        for (let column = x; column < x + boxWidth; column += 1) {
          if (column < 0 || row < 0 || column >= width || row >= height)
            continue;
          const offset = row * stride + 1 + column * 4;
          raw[offset] = color[0];
          raw[offset + 1] = color[1];
          raw[offset + 2] = color[2];
          raw[offset + 3] = color[3];
        }
      }
    };
    const green: [number, number, number, number] = [10, 157, 112, 255];
    const navy: [number, number, number, number] = [30, 52, 80, 255];
    const pale: [number, number, number, number] = [224, 245, 237, 255];
    rectangle(0, 0, width, height, [249, 252, 251, 255]);
    if (variant) {
      [45, 135, 225, 315].forEach((x, index) => {
        rectangle(
          x,
          155 - index * 25,
          55,
          30 + index * 25,
          index % 2 ? green : navy,
        );
      });
    } else {
      [40, 160, 280].forEach((x, index) => {
        rectangle(x, 75, 90, 70, index % 2 ? pale : green);
        if (index < 2) rectangle(x + 90, 107, 30, 6, navy);
      });
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 6;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      this.pngChunk('IHDR', header),
      this.pngChunk('IDAT', deflateSync(raw)),
      this.pngChunk('IEND', Buffer.alloc(0)),
    ]);
  }

  private pngChunk(type: string, data: Buffer) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const chunk = Buffer.alloc(12 + data.length);
    chunk.writeUInt32BE(data.length, 0);
    typeBuffer.copy(chunk, 4);
    data.copy(chunk, 8);
    chunk.writeUInt32BE(
      this.crc32(Buffer.concat([typeBuffer, data])),
      8 + data.length,
    );
    return chunk;
  }

  private createStoredZip(
    entries: Array<{ name: string; data: string | Buffer }>,
  ) {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;
    for (const entry of entries) {
      const name = Buffer.from(entry.name, 'utf8');
      const data = Buffer.isBuffer(entry.data)
        ? entry.data
        : Buffer.from(entry.data, 'utf8');
      const crc = this.crc32(data);
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(20, 4);
      local.writeUInt16LE(0, 6);
      local.writeUInt16LE(0, 8);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(data.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(name.length, 26);
      localParts.push(local, name, data);

      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0);
      central.writeUInt16LE(20, 4);
      central.writeUInt16LE(20, 6);
      central.writeUInt16LE(0, 8);
      central.writeUInt16LE(0, 10);
      central.writeUInt32LE(crc, 16);
      central.writeUInt32LE(data.length, 20);
      central.writeUInt32LE(data.length, 24);
      central.writeUInt16LE(name.length, 28);
      central.writeUInt32LE(offset, 42);
      centralParts.push(central, name);
      offset += local.length + name.length + data.length;
    }
    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...localParts, centralDirectory, end]);
  }

  private crc32(data: Buffer) {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  private normalizeAnswer(value: string, caseSensitive = false) {
    const normalized = value.trim().replace(/\s+/g, ' ');
    return caseSensitive ? normalized : normalized.toLocaleLowerCase();
  }

  private fileHash(buffer: Buffer) {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private importFingerprint(input: {
    importMode?: string;
    organizationId: number;
    examTemplateVersionId: number;
    scope: ExamImportScope;
    examTemplateSlotId?: number;
    examTemplateSectionId?: number;
    subjectId?: number;
    wordFileHash: string;
    excelFileHash: string;
  }) {
    return createHash('sha256')
      .update(
        JSON.stringify([
          input.importMode ?? ExamImportMode.PAIRED_WORD_EXCEL,
          input.organizationId,
          input.examTemplateVersionId,
          input.scope,
          input.examTemplateSlotId ?? null,
          input.examTemplateSectionId ?? null,
          input.subjectId ?? null,
          input.wordFileHash,
          input.excelFileHash,
        ]),
      )
      .digest('hex');
  }

  private rethrowUnique(error: unknown, message: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException(message);
    throw error;
  }
}
