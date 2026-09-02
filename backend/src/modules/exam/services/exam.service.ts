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
  ExamAttemptStatus,
  ExamResultReleaseMode,
  ExamStatus,
  ExamTemplateStatus,
  ExamTemplateVersionStatus,
  Prisma,
  QuestionDifficulty,
  QuestionStatus,
  ResourceStatus,
  ExamVirtualKeyboardMode,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { deflateSync } from 'node:zlib';

import { CurrentUser } from '../../auth/types/current-user.types';
import { ManagedObjectService } from '../../storage/managed-object.service';
import {
  CreateExamDto,
  CreateExamImportDto,
  ExamImportMode,
  ExamImportListQueryDto,
  CreateExamTemplateDto,
  CreateTemplateVersionDto,
  CreateQuestionDto,
  CreateSubjectDto,
  CreateTopicDto,
  OrganizationScopedQueryDto,
  QuestionListQueryDto,
  QuestionListSort,
  ReorderTemplateItemsDto,
  SaveTemplateStructureDto,
  TemplateListQueryDto,
  TopicListQueryDto,
  UpdateExamTemplateDto,
  UpdateSubjectDto,
  UpdateTopicDto,
} from '../dto/exam.dto';
import { ExamRepository } from '../repositories/exam.repository';
import {
  QUESTION_TYPE_CODES,
  QUESTION_TYPE_IDS,
  type QuestionTypeCode,
} from '../constants/question-type.constants';
import {
  aggregateReportPerformance,
  attainableMaximumScoreByGroup,
  examReportResultStatus,
  summarizeReportAnswers,
} from '../reporting/exam-report-metrics';
import {
  buildExamResultNotification,
  buildScheduledExamNotification,
} from '../../students/student-notification.rules';
import {
  generateInternalCode,
  normalizeInternalCode,
  normalizeInternalLookupKey,
} from '../../../common/utils/internal-code';

const EXAM_ANSWER_REVIEW_PERMISSION = 'exam-answer.read';

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
  topicId?: number;
  topicCode?: string;
  questionCode: string;
  questionTypeId?: number;
  rawQuestionTypeId?: number;
  rawQuestionTypeCode?: string;
  difficulty: QuestionDifficulty;
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
  | 'topicCode'
  | 'questionCode'
  | 'rawQuestionTypeCode'
  | 'difficulty'
  | 'comprehensionCode'
  | 'marks'
  | 'negativeMarks'
  | 'sortOrder'
  | 'rawData'
> & {
  difficultyInvalid?: boolean;
  legacyQuestionTypeIdPresent?: boolean;
};

type ImportQuestionType = {
  id: number;
  code: string;
  isActive?: boolean;
};

type CodelessExcelQuestionMapping = Omit<
  ExcelQuestionMapping,
  'questionCode' | 'comprehensionCode'
> & {
  questionNumber?: number;
  questionNumberInvalid?: boolean;
};

type CodelessSharedContentKind = 'COMPREHENSION' | 'DIRECTIONS';

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
  comprehensionKind?: CodelessSharedContentKind;
  comprehensionRangeStart?: number;
  comprehensionRangeEnd?: number;
  answerRulesContent?: string;
};

type ImportTemplateStructure = Array<{
  id: number;
  code: string;
  name: string;
  sections: Array<{
    id: number;
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
}>;

type ImportJobWithRows = Prisma.ExamImportJobGetPayload<{
  include: {
    rows: { include: { questionType: true; topic: true } };
    files: true;
    errors: true;
  };
}>;

const templateInclude = {
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
                          topic: true,
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
  constructor(
    private readonly repository: ExamRepository,
    private readonly managedObjects?: ManagedObjectService,
  ) {}

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
    const code = await generateInternalCode({
      fallback: 'SUBJECT',
      isTaken: async (candidate) =>
        Boolean(
          await this.prisma.subject.findFirst({
            where: { organizationId, code: candidate },
            select: { id: true },
          }),
        ),
      maxLength: 40,
      source: dto.name,
    });
    try {
      return await this.prisma.subject.create({
        data: {
          organizationId,
          code,
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

  async listTopics(user: CurrentUser, query: TopicListQueryDto) {
    const organizationId = this.organizationId(user, query.organizationId);
    return this.prisma.topic.findMany({
      where: {
        organizationId,
        subjectId: query.subjectId,
        isActive: query.includeInactive ? undefined : true,
      },
      include: {
        subject: true,
        _count: { select: { questionVersions: true } },
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async createTopic(user: CurrentUser, dto: CreateTopicDto) {
    const organizationId = this.organizationId(user, dto.organizationId);
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, organizationId, isActive: true },
    });
    if (!subject) {
      throw new BadRequestException(
        'Subject does not belong to this organization',
      );
    }
    const code = await generateInternalCode({
      fallback: 'TOPIC',
      isTaken: async (candidate) =>
        Boolean(
          await this.prisma.topic.findFirst({
            where: { subjectId: subject.id, code: candidate },
            select: { id: true },
          }),
        ),
      maxLength: 60,
      source: dto.name,
    });

    try {
      return await this.prisma.topic.create({
        data: {
          organizationId,
          subjectId: subject.id,
          code,
          name: dto.name,
          description: dto.description,
          sortOrder: dto.sortOrder ?? 0,
        },
        include: { subject: true },
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'A topic with this code or name already exists for the subject',
      );
    }
  }

  async updateTopic(user: CurrentUser, id: number, dto: UpdateTopicDto) {
    const topic = await this.topicForUser(user, id);

    try {
      return await this.prisma.topic.update({
        where: { id: topic.id },
        data: dto,
        include: { subject: true },
      });
    } catch (error) {
      this.rethrowUnique(error, 'A topic with this name already exists');
    }
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
        versions:
          query.questionTypeId || query.topicId || query.difficulty
            ? {
                some: {
                  ...(query.questionTypeId
                    ? { questionTypeId: query.questionTypeId }
                    : {}),
                  ...(query.topicId ? { topicId: query.topicId } : {}),
                  ...(query.difficulty ? { difficulty: query.difficulty } : {}),
                },
              }
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
            topic: true,
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
    if (dto.topicId) {
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: dto.topicId,
          organizationId,
          subjectId: subject.id,
          isActive: true,
        },
      });
      if (!topic) {
        throw new BadRequestException(
          'Topic does not belong to the selected subject',
        );
      }
    }
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
    const code = await generateInternalCode({
      fallback: 'QUESTION',
      isTaken: async (candidate) =>
        Boolean(
          await this.prisma.question.findFirst({
            where: { organizationId, code: candidate },
            select: { id: true },
          }),
        ),
      maxLength: 80,
      source: `${subject.code}-QUESTION`,
    });

    try {
      return await this.prisma.question.create({
        data: {
          organizationId,
          subjectId: dto.subjectId,
          code,
          status: dto.status ?? QuestionStatus.DRAFT,
          versions: {
            create: {
              versionNumber: 1,
              questionTypeId: questionType.id,
              difficulty: dto.difficulty ?? QuestionDifficulty.MEDIUM,
              topicId: dto.topicId,
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
              topic: true,
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
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 100));
    const where: Prisma.ExamTemplateWhereInput = {
      organizationId,
      isActive: true,
      status: query.status,
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
      skip: (page - 1) * limit,
      take: limit,
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
      return {
        ...template,
        _summary: {
          durationMinutes: latestVersion?.defaultDurationMinutes ?? null,
          defaultAttemptLimit: latestVersion?.defaultAttemptLimit ?? 1,
          slotCount: latestVersion?.slots.length ?? 0,
          sectionCount: sections.length,
          questionCount,
          latestVersionStatus: latestVersion?.status ?? template.status,
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
    const code = await this.generateTemplateCode(organizationId, dto.name);
    try {
      return await this.prisma.examTemplate.create({
        data: {
          organizationId,
          code,
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
    try {
      return await this.prisma.examTemplate.update({
        where: { id: template.id },
        data: {
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
    this.assignStructureCodes(dto);
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
              `A question in section ${section.name} does not belong to subject ${subject.subjectId}`,
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
            code: slot.code!.toUpperCase(),
            name: slot.name,
            description: slot.description,
            instructions: slot.instructions,
            durationMinutes: slot.durationMinutes,
            navigationMode: slot.navigationMode,
            autoSubmitOnTimeout: slot.autoSubmitOnTimeout ?? true,
            sortOrder: slotIndex,
            sections: {
              create: slot.sections.map((section, sectionIndex) => ({
                code: section.code!.toUpperCase(),
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
    for (const slot of version.slots) {
      for (const section of slot.sections) {
        const available = section.subjects.reduce(
          (total, subject) => total + subject.questions.length,
          0,
        );
        if (!available)
          throw new BadRequestException(
            `${section.name} must contain at least one question before publishing`,
          );
        if (
          section.questionsToAttempt &&
          section.questionsToAttempt > available
        )
          throw new BadRequestException(
            `questionsToAttempt exceeds available questions in ${section.name}`,
          );
      }
    }
    const questionVersionIds = [
      ...new Set(
        version.slots.flatMap((slot) =>
          slot.sections.flatMap((section) =>
            section.subjects.flatMap((subject) =>
              subject.questions.map((question) => question.questionVersionId),
            ),
          ),
        ),
      ),
    ];
    const questionIds = [
      ...new Set(
        version.slots.flatMap((slot) =>
          slot.sections.flatMap((section) =>
            section.subjects.flatMap((subject) =>
              subject.questions.map(
                (question) => question.questionVersion.question.id,
              ),
            ),
          ),
        ),
      ),
    ];
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
      this.prisma.questionVersion.updateMany({
        where: { id: { in: questionVersionIds } },
        data: { isPublished: true },
      }),
      this.prisma.question.updateMany({
        where: { id: { in: questionIds } },
        data: { status: QuestionStatus.PUBLISHED },
      }),
    ]);
    return this.getTemplate(user, templateId);
  }

  async createTemplateVersion(
    user: CurrentUser,
    templateId: number,
    dto?: CreateTemplateVersionDto,
  ) {
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
                    questions:
                      dto?.copyQuestions === false
                        ? undefined
                        : {
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

  async reorderTemplateSlots(
    user: CurrentUser,
    templateId: number,
    versionId: number,
    dto: ReorderTemplateItemsDto,
  ) {
    const template = await this.getTemplate(user, templateId);
    const version = template.versions.find((item) => item.id === versionId);
    if (!version) throw new NotFoundException('Template version not found');
    if (version.status !== ExamTemplateVersionStatus.DRAFT)
      throw new ConflictException(
        'Published template versions are immutable; create a new version first',
      );
    const existingIds = version.slots.map((slot) => slot.id);
    this.assertCompleteOrder(existingIds, dto.orderedIds, 'slots');
    await this.prisma.$transaction(
      dto.orderedIds.map((id, sortOrder) =>
        this.prisma.examTemplateSlot.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );
    return this.getTemplate(user, templateId);
  }

  async reorderTemplateSections(
    user: CurrentUser,
    templateId: number,
    versionId: number,
    slotId: number,
    dto: ReorderTemplateItemsDto,
  ) {
    const template = await this.getTemplate(user, templateId);
    const version = template.versions.find((item) => item.id === versionId);
    if (!version) throw new NotFoundException('Template version not found');
    if (version.status !== ExamTemplateVersionStatus.DRAFT)
      throw new ConflictException(
        'Published template versions are immutable; create a new version first',
      );
    const slot = version.slots.find((item) => item.id === slotId);
    if (!slot) throw new NotFoundException('Template slot not found');
    const existingIds = slot.sections.map((section) => section.id);
    this.assertCompleteOrder(existingIds, dto.orderedIds, 'sections');
    await this.prisma.$transaction(
      dto.orderedIds.map((id, sortOrder) =>
        this.prisma.examTemplateSection.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );
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

  async getExamQuestions(user: CurrentUser, examId: number) {
    const canViewAnswers =
      user.roles?.includes('SUPER_ADMIN') === true ||
      user.permissions?.includes(EXAM_ANSWER_REVIEW_PERMISSION) === true;
    const exam = await this.prisma.exam.findFirst({
      where: {
        id: examId,
        organizationId: user.organizationId ?? undefined,
        isActive: true,
      },
      include: {
        session: true,
        templateVersion: { include: { examTemplate: true } },
        selectedSlots: {
          orderBy: { sortOrder: 'asc' },
          include: {
            templateSlot: {
              include: {
                sections: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    subjects: {
                      orderBy: { sortOrder: 'asc' },
                      include: {
                        subject: true,
                        questions: {
                          orderBy: { sortOrder: 'asc' },
                          include: {
                            questionVersion: {
                              include: {
                                question: true,
                                questionType: true,
                                topic: true,
                                comprehension: true,
                                options: { orderBy: { sortOrder: 'asc' } },
                                acceptedAnswers: {
                                  orderBy: { sortOrder: 'asc' },
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
        },
      },
    });
    if (!exam) throw new NotFoundException('Scheduled exam not found');
    this.assertOrganization(user, exam.organizationId);
    return {
      exam: {
        id: exam.id,
        code: exam.code,
        title: exam.title,
        status: exam.status,
        availableFrom: exam.availableFrom,
        availableUntil: exam.availableUntil,
        durationMinutes: exam.durationMinutes,
        session: exam.session,
        template: {
          id: exam.templateVersion.examTemplate.id,
          name: exam.templateVersion.examTemplate.name,
          versionId: exam.templateVersion.id,
          versionNumber: exam.templateVersion.versionNumber,
        },
      },
      canViewAnswers,
      slots: exam.selectedSlots.map(({ id, sortOrder, templateSlot }) => ({
        id,
        sortOrder,
        templateSlotId: templateSlot.id,
        code: templateSlot.code,
        name: templateSlot.name,
        durationMinutes: templateSlot.durationMinutes,
        sections: templateSlot.sections.map((section) => ({
          ...section,
          subjects: section.subjects.map((subject) => ({
            ...subject,
            questions: subject.questions.map((question) => ({
              ...question,
              marks: Number(question.marks),
              negativeMarks: Number(question.negativeMarks),
              questionVersion: {
                ...question.questionVersion,
                explanation: canViewAnswers
                  ? question.questionVersion.explanation
                  : null,
                options: question.questionVersion.options.map((option) => ({
                  ...option,
                  isCorrect: canViewAnswers ? option.isCorrect : false,
                })),
                acceptedAnswers: canViewAnswers
                  ? question.questionVersion.acceptedAnswers
                  : [],
                defaultMarks: Number(question.questionVersion.defaultMarks),
                defaultNegativeMarks: Number(
                  question.questionVersion.defaultNegativeMarks,
                ),
              },
            })),
          })),
        })),
      })),
    };
  }

  async getExamReport(user: CurrentUser, examId: number) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        session: true,
        courseAssignments: {
          include: { sessionCourse: { include: { course: true } } },
        },
      },
    });
    if (!exam || !exam.isActive) throw new NotFoundException('Exam not found');
    this.assertOrganization(user, exam.organizationId);

    const attempts = await this.prisma.studentExamAttempt.findMany({
      where: {
        examId: exam.id,
        status: {
          in: [
            ExamAttemptStatus.SUBMITTED,
            ExamAttemptStatus.AUTO_SUBMITTED,
            ExamAttemptStatus.EVALUATED,
          ],
        },
        score: { not: null },
      },
      include: {
        student: { include: { user: true } },
        answers: { include: { selectedOptions: true } },
        questions: {
          include: {
            sectionAttempt: { include: { templateSection: true } },
            templateQuestion: {
              include: {
                sectionSubject: { include: { subject: true } },
                questionVersion: { include: { topic: true } },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const bestByStudent = new Map<number, (typeof attempts)[number]>();
    for (const attempt of attempts) {
      const existing = bestByStudent.get(attempt.studentId);
      const percentage = Number(attempt.maximumScore ?? 0)
        ? Number(attempt.score ?? 0) / Number(attempt.maximumScore)
        : 0;
      const existingPercentage = existing
        ? Number(existing.maximumScore ?? 0)
          ? Number(existing.score ?? 0) / Number(existing.maximumScore)
          : 0
        : -Infinity;
      if (
        !existing ||
        percentage > existingPercentage ||
        (percentage === existingPercentage &&
          attempt.durationSeconds < existing.durationSeconds)
      ) {
        bestByStudent.set(attempt.studentId, attempt);
      }
    }
    const includedAttempts = [...bestByStudent.values()];
    const performanceItems = includedAttempts.flatMap((attempt) => {
      const answerByQuestion = new Map(
        attempt.answers.map((answer) => [
          answer.examTemplateQuestionId,
          answer,
        ]),
      );
      return attempt.questions.map((question) => {
        const templateQuestion = question.templateQuestion;
        return {
          attempt,
          question,
          answer: answerByQuestion.get(question.examTemplateQuestionId) ?? null,
          subject: templateQuestion.sectionSubject.subject,
          topic: templateQuestion.questionVersion.topic,
          difficulty: templateQuestion.questionVersion.difficulty,
          section: question.sectionAttempt.templateSection,
          maximumMarks: Number(templateQuestion.marks),
        };
      });
    });
    const commonMetric = (item: (typeof performanceItems)[number]) => ({
      marksAwarded: Number(item.answer?.marksAwarded ?? 0),
      maximumMarks: item.maximumMarks,
      timeSpentSeconds: item.question.timeSpentSeconds,
      answer: item.answer,
    });
    const sectionMaximumByAttempt = attainableMaximumScoreByGroup(
      performanceItems.map((item) => ({
        groupKey: `attempt:${item.attempt.id}:section:${item.section.id}`,
        marks: item.maximumMarks,
        questionsToAttempt: item.section.questionsToAttempt,
      })),
    );
    const sectionMaximums = new Map<string, number>();
    for (const [attemptSectionKey, maximumMarks] of sectionMaximumByAttempt) {
      const sectionKey = `section:${attemptSectionKey.split(':').at(-1)}`;
      sectionMaximums.set(
        sectionKey,
        (sectionMaximums.get(sectionKey) ?? 0) + maximumMarks,
      );
    }
    const sections = aggregateReportPerformance(
      performanceItems.map((item) => ({
        ...commonMetric(item),
        groupKey: `section:${item.section.id}`,
        groupLabel: item.section.name,
        metadata: {
          sectionId: item.section.id,
          sectionCode: item.section.code,
        },
      })),
    ).map((section) => {
      const maximumMarks = sectionMaximums.get(section.key) ?? 0;
      return {
        ...section,
        maximumMarks,
        percentage: maximumMarks
          ? Math.round((section.marksAwarded / maximumMarks) * 10_000) / 100
          : 0,
      };
    });
    const topics = aggregateReportPerformance(
      performanceItems.map((item) => ({
        ...commonMetric(item),
        groupKey: item.topic
          ? `topic:${item.topic.id}`
          : `subject:${item.subject.id}:uncategorized`,
        groupLabel: item.topic?.name ?? 'Uncategorized',
        metadata: {
          topicId: item.topic?.id ?? null,
          topicCode: item.topic?.code ?? null,
          subjectId: item.subject.id,
          subjectName: item.subject.name,
        },
      })),
    );
    const difficulties = aggregateReportPerformance(
      performanceItems.map((item) => ({
        ...commonMetric(item),
        groupKey: `difficulty:${item.difficulty}`,
        groupLabel:
          item.difficulty.charAt(0) + item.difficulty.slice(1).toLowerCase(),
        metadata: { difficulty: item.difficulty },
      })),
    );
    const students = includedAttempts
      .map((attempt) => {
        const answerByQuestion = new Map(
          attempt.answers.map((answer) => [
            answer.examTemplateQuestionId,
            answer,
          ]),
        );
        const maximumScore = Number(attempt.maximumScore ?? 0);
        const score = Number(attempt.score ?? 0);
        const percentage = maximumScore
          ? Math.round((score / maximumScore) * 10_000) / 100
          : 0;
        const passingPercentage =
          exam.passingPercentage === null
            ? null
            : Number(exam.passingPercentage);
        return {
          studentId: attempt.studentId,
          rollNumber: attempt.student.rollNumber,
          name: [attempt.student.user.firstName, attempt.student.user.lastName]
            .filter(Boolean)
            .join(' '),
          attemptUuid: attempt.uuid,
          attemptNumber: attempt.attemptNumber,
          submittedAt: attempt.submittedAt,
          durationSeconds: attempt.durationSeconds,
          score,
          maximumScore,
          percentage,
          resultStatus: examReportResultStatus(percentage, passingPercentage),
          summary: summarizeReportAnswers(
            attempt.questions.length,
            attempt.questions.map(
              (question) =>
                answerByQuestion.get(question.examTemplateQuestionId) ?? null,
            ),
          ),
        };
      })
      .sort(
        (left, right) =>
          right.percentage - left.percentage ||
          left.durationSeconds - right.durationSeconds,
      )
      .map((student, index) => ({ ...student, rank: index + 1 }));
    const percentages = students.map((student) => student.percentage);
    const accuracies = students.map(
      (student) => student.summary?.accuracy ?? 0,
    );
    const completionRates = students.map(
      (student) => student.summary?.completionRate ?? 0,
    );
    const durations = students.map((student) => student.durationSeconds);
    const passedStudents = students.filter(
      (student) => student.resultStatus === 'PASSED',
    ).length;
    const failedStudents = students.filter(
      (student) => student.resultStatus === 'FAILED',
    ).length;

    return {
      exam: {
        id: exam.id,
        code: exam.code,
        title: exam.title,
        passingPercentage:
          exam.passingPercentage === null
            ? null
            : Number(exam.passingPercentage),
        session: exam.session,
        courses: exam.courseAssignments.map(
          (assignment) => assignment.sessionCourse.course,
        ),
      },
      basis: 'BEST_ATTEMPT_PER_STUDENT',
      summary: {
        totalAttempts: attempts.length,
        students: students.length,
        averagePercentage: percentages.length
          ? Math.round(
              (percentages.reduce((total, value) => total + value, 0) /
                percentages.length) *
                100,
            ) / 100
          : 0,
        highestPercentage: percentages.length ? Math.max(...percentages) : 0,
        lowestPercentage: percentages.length ? Math.min(...percentages) : 0,
        averageAccuracy: accuracies.length
          ? Math.round(
              (accuracies.reduce((total, value) => total + value, 0) /
                accuracies.length) *
                100,
            ) / 100
          : 0,
        averageCompletionRate: completionRates.length
          ? Math.round(
              (completionRates.reduce((total, value) => total + value, 0) /
                completionRates.length) *
                100,
            ) / 100
          : 0,
        averageDurationSeconds: durations.length
          ? Math.round(
              durations.reduce((total, value) => total + value, 0) /
                durations.length,
            )
          : 0,
        passedStudents,
        failedStudents,
        passRate:
          passedStudents + failedStudents
            ? Math.round(
                (passedStudents / (passedStudents + failedStudents)) * 10_000,
              ) / 100
            : null,
      },
      performance: { sections, topics, difficulties },
      students,
    };
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
    const code = await generateInternalCode({
      fallback: 'EXAM',
      isTaken: async (candidate) =>
        Boolean(
          await this.prisma.exam.findFirst({
            where: { organizationId, code: candidate },
            select: { id: true },
          }),
        ),
      maxLength: 80,
      source: dto.title,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const exam = await tx.exam.create({
          data: {
            organizationId,
            sessionId: dto.sessionId,
            examTemplateVersionId: dto.examTemplateVersionId,
            code,
            title: dto.title,
            instructions: dto.instructions,
            availableFrom,
            availableUntil,
            durationMinutes: dto.durationMinutes,
            attemptLimit: dto.attemptLimit,
            passingPercentage: dto.passingPercentage,
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
          const resource = await tx.resource.create({
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

          if (published) {
            const enrollments = await tx.studentCourseEnrollment.findMany({
              where: {
                sessionCourseId: { in: dto.sessionCourseIds },
                isActive: true,
                status: { in: ['ACTIVE', 'COMPLETED'] },
                enrollment: {
                  organizationId,
                  isActive: true,
                  status: { in: ['ACTIVE', 'COMPLETED'] },
                  student: {
                    organizationId,
                    isActive: true,
                    user: { isActive: true },
                  },
                },
              },
              select: {
                enrollment: {
                  select: {
                    student: {
                      select: {
                        id: true,
                        preferences: {
                          select: {
                            inAppNotifications: true,
                            examReminders: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });
            const studentIds = [
              ...new Set(
                enrollments
                  .map(({ enrollment }) => enrollment.student)
                  .filter(
                    (student) =>
                      (student.preferences?.inAppNotifications ?? true) &&
                      (student.preferences?.examReminders ?? true),
                  )
                  .map((student) => student.id),
              ),
            ];
            const notification = buildScheduledExamNotification({
              title: exam.title,
              resourceId: resource.id,
              availableUntil: exam.availableUntil,
              live: dto.status === ExamStatus.LIVE,
            });

            if (studentIds.length) {
              await tx.studentNotification.createMany({
                data: studentIds.map((studentId) => ({
                  ...notification,
                  studentId,
                  organizationId,
                })),
                skipDuplicates: true,
              });
            }
          }
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
      include: {
        resources: {
          where: { isActive: true },
          orderBy: { id: 'asc' },
          take: 1,
        },
        attempts: {
          where: {
            status: { in: ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'] },
          },
          select: {
            student: {
              select: {
                id: true,
                preferences: {
                  select: { inAppNotifications: true },
                },
              },
            },
          },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.exam.update({
        where: { id: exam.id },
        data: { resultsReleasedAt: new Date() },
      });
      const resource = exam.resources[0];

      if (resource) {
        const studentIds = [
          ...new Set(
            exam.attempts
              .map(({ student }) => student)
              .filter(
                (student) => student.preferences?.inAppNotifications ?? true,
              )
              .map((student) => student.id),
          ),
        ];
        const notification = buildExamResultNotification({
          title: exam.title,
          resourceId: resource.id,
        });

        if (studentIds.length) {
          await tx.studentNotification.createMany({
            data: studentIds.map((studentId) => ({
              ...notification,
              studentId,
              organizationId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return updated;
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
      throw new BadRequestException(
        'Choose the Word question-content file (.docx) before starting the import.',
      );
    if (!excelFile)
      throw new BadRequestException(
        'Choose the Excel question-mapping file (.xlsx) before starting the import.',
      );
    if (
      wordFile.size > 15 * 1024 * 1024 ||
      (excelFile?.size ?? 0) > 15 * 1024 * 1024
    )
      throw new BadRequestException(
        'One of the selected files is larger than 15 MB. Choose files that are 15 MB or smaller.',
      );
    if (extname(wordFile.originalname).toLowerCase() !== '.docx')
      throw new BadRequestException(
        'The question-content file must be a Word .docx file.',
      );
    if (excelFile && extname(excelFile.originalname).toLowerCase() !== '.xlsx')
      throw new BadRequestException(
        'The question-mapping file must be an Excel .xlsx file.',
      );
    const version = await this.prisma.examTemplateVersion.findUnique({
      where: { id: dto.examTemplateVersionId },
      include: {
        examTemplate: {
          include: { organization: { select: { id: true, uuid: true } } },
        },
      },
    });
    if (!version)
      throw new NotFoundException(
        'The selected exam template version could not be found. Refresh the page and select it again.',
      );
    this.assertOrganization(user, version.examTemplate.organizationId);
    if (version.status !== ExamTemplateVersionStatus.DRAFT)
      throw new ConflictException(
        'Questions can only be imported into a draft template version. Create or select a draft version and try again.',
      );
    if (
      dto.scope === ExamImportScope.SINGLE_SECTION &&
      !dto.examTemplateSectionId
    ) {
      throw new BadRequestException(
        'Select the section where these questions should be imported.',
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
          'The selected section is not part of this template version. Refresh the page and select the destination again.',
        );
      if (section.subjects.length !== 1)
        throw new BadRequestException(
          'The selected section must contain exactly one subject before questions can be imported.',
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
        `These Word and Excel files were already uploaded for this destination. Open import #${duplicateImport.id} or choose different files.`,
      );

    const questionTypes = await this.prisma.questionType.findMany({
      orderBy: { id: 'asc' },
    });
    const rows =
      importMode === ExamImportMode.CODELESS_WORD
        ? await this.buildCodelessWordRows(
            wordFile.buffer,
            this.parseCodelessWorkbookMappings(excelFile.buffer),
            version.id,
            effectiveDto,
            questionTypes,
          )
        : this.mergeImportFiles(
            await this.parseWordContent(wordFile.buffer),
            this.parseWorkbookMappings(excelFile.buffer),
            questionTypes,
          );
    await this.validateImportDestinations(
      version.id,
      version.examTemplate.organizationId,
      effectiveDto,
      rows,
    );
    const counts = this.importCounts(rows);
    const managedObjects = this.managedObjects;
    if (!managedObjects) {
      throw new Error('Managed object storage is not configured');
    }
    let importJob: { id: number; uuid: string };

    try {
      importJob = await this.prisma.examImportJob.create({
        data: {
          importFingerprint,
          organizationId: version.examTemplate.organizationId,
          examTemplateVersionId: version.id,
          examTemplateSlotId: effectiveDto.examTemplateSlotId,
          examTemplateSectionId: effectiveDto.examTemplateSectionId,
          subjectId: effectiveDto.subjectId,
          uploadedById: user.userId,
          scope: effectiveDto.scope,
          status: ExamImportStatus.UPLOADED,
        },
        select: { id: true, uuid: true },
      });
    } catch (error) {
      this.rethrowUnique(
        error,
        'This Word and Excel file pair has already been uploaded for this destination',
      );
    }

    const storedObjects: Array<{ id: number; uuid: string }> = [];
    const organization = version.examTemplate.organization;
    try {
      const wordObject = await managedObjects.upload({
        organization,
        owner: {
          category: 'exam-imports',
          id: importJob.id,
          uuid: importJob.uuid,
        },
        uploadedById: user.userId,
        originalFileName: wordFile.originalname,
        mimeType: wordFile.mimetype,
        body: wordFile.buffer,
      });
      storedObjects.push(wordObject);

      const excelObject = excelFile
        ? await managedObjects.upload({
            organization,
            owner: {
              category: 'exam-imports',
              id: importJob.id,
              uuid: importJob.uuid,
            },
            uploadedById: user.userId,
            originalFileName: excelFile.originalname,
            mimeType: excelFile.mimetype,
            body: excelFile.buffer,
          })
        : null;
      if (excelObject) storedObjects.push(excelObject);

      return await this.prisma.examImportJob.update({
        where: { id: importJob.id },
        data: {
          status: counts.errorRows
            ? ExamImportStatus.VALIDATION_FAILED
            : ExamImportStatus.READY_FOR_REVIEW,
          ...counts,
          files: {
            create: [
              {
                kind: ExamImportFileKind.CONTENT_DOCX,
                originalFileName: wordFile.originalname,
                storedObjectId: wordObject.id,
                fileHash: wordFileHash,
                mimeType: wordFile.mimetype,
                sizeBytes: wordFile.size,
              },
              ...(excelFile && excelObject
                ? [
                    {
                      kind: ExamImportFileKind.MAPPING_XLSX,
                      originalFileName: excelFile.originalname,
                      storedObjectId: excelObject.id,
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
              topicId: row.topicId,
              topicCode: row.topicCode,
              questionCode: row.questionCode,
              questionTypeId: row.questionTypeId,
              rawQuestionTypeId: row.rawQuestionTypeId,
              difficulty: row.difficulty,
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
          rows: { include: { questionType: true, topic: true } },
          errors: true,
        },
      });
    } catch (error) {
      await Promise.all(
        storedObjects.map((object) =>
          managedObjects
            .delete(object.id, object.uuid, organization.id)
            .catch(() => undefined),
        ),
      );
      await this.prisma.examImportJob
        .delete({ where: { id: importJob.id } })
        .catch(() => undefined);
      this.rethrowImportStagingError(error);
    }
  }

  async getImport(user: CurrentUser, id: number): Promise<ImportJobWithRows> {
    const job = await this.prisma.examImportJob.findUnique({
      where: { id },
      include: {
        files: true,
        rows: {
          orderBy: { sourceIndex: 'asc' },
          include: { questionType: true, topic: true },
        },
        errors: true,
      },
    });
    if (!job) throw new NotFoundException('Exam import job not found');
    this.assertOrganization(user, job.organizationId);
    return job;
  }

  async listImports(user: CurrentUser, query: ExamImportListQueryDto) {
    const organizationId = this.organizationId(user, query.organizationId);
    return this.prisma.examImportJob.findMany({
      where: {
        organizationId,
        examTemplateVersionId: query.examTemplateVersionId,
        status: query.status,
      },
      include: {
        files: true,
        rows: {
          orderBy: { sourceIndex: 'asc' },
          include: { questionType: true, topic: true },
        },
        errors: true,
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });
  }

  async commitImport(user: CurrentUser, id: number) {
    const job = await this.getImport(user, id);
    if (job.status !== ExamImportStatus.READY_FOR_REVIEW)
      throw new ConflictException(
        'This import cannot be completed because it is not ready for review. Correct any listed row errors, then upload the files again.',
      );
    const claimed = await this.prisma.examImportJob.updateMany({
      where: { id, status: ExamImportStatus.READY_FOR_REVIEW },
      data: { status: ExamImportStatus.IMPORTING },
    });
    if (claimed.count !== 1)
      throw new ConflictException(
        'These questions are already being imported, or the import changed after you opened it. Refresh the page before trying again.',
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
                difficulty: row.difficulty,
                topicId: row.topicId,
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

  private addImportTemplateReferences(
    sheet: XLSX.WorkSheet,
    instructions: Array<[string, string]>,
  ) {
    XLSX.utils.sheet_add_aoa(
      sheet,
      [
        ['Reference ID', 'Production code', 'Question type'],
        [
          QUESTION_TYPE_IDS.SINGLE_CHOICE,
          QUESTION_TYPE_CODES.SINGLE_CHOICE,
          'Single Answer',
        ],
        [
          QUESTION_TYPE_IDS.NUMERIC,
          QUESTION_TYPE_CODES.NUMERIC,
          'Numeric Answer',
        ],
        [
          QUESTION_TYPE_IDS.ONE_WORD,
          QUESTION_TYPE_CODES.ONE_WORD,
          'One Word Answer',
        ],
        [
          QUESTION_TYPE_IDS.MULTIPLE_CHOICE,
          QUESTION_TYPE_CODES.MULTIPLE_CHOICE,
          'Multiple Answer',
        ],
        [
          QUESTION_TYPE_IDS.SUBJECTIVE,
          QUESTION_TYPE_CODES.SUBJECTIVE,
          'Subjective Answer',
        ],
      ],
      { origin: 'M1' },
    );
    XLSX.utils.sheet_add_aoa(
      sheet,
      [
        ['Difficulty code', 'Display name'],
        [QuestionDifficulty.EASY, 'Easy'],
        [QuestionDifficulty.MEDIUM, 'Medium'],
        [QuestionDifficulty.HARD, 'Hard'],
      ],
      { origin: 'Q1' },
    );
    XLSX.utils.sheet_add_aoa(
      sheet,
      [['Import instruction', 'What to do'], ...instructions],
      { origin: 'T1' },
    );
    sheet['!cols'] = [
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 28 },
      { wch: 24 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 13 },
      { wch: 3 },
      { wch: 13 },
      { wch: 24 },
      { wch: 22 },
      { wch: 3 },
      { wch: 18 },
      { wch: 16 },
      { wch: 3 },
      { wch: 22 },
      { wch: 58 },
    ];
  }

  createExcelImportTemplate() {
    const rows = [
      {
        question_code: 'ENG-RC-001',
        comprehension_code: 'RC-001',
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'READING_COMPREHENSION',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.MEDIUM,
        marks: 5,
        negative_marks: 1,
        sort_order: 1,
      },
      {
        question_code: 'MAT-NUM-001',
        comprehension_code: '',
        slot_code: 'CUET_SLOT_1',
        section_code: 'QUANT',
        subject_code: 'MATHEMATICS',
        topic_code: 'PERCENTAGES',
        question_type_code: QUESTION_TYPE_CODES.NUMERIC,
        difficulty: QuestionDifficulty.EASY,
        marks: 5,
        negative_marks: 0,
        sort_order: 2,
      },
      {
        question_code: 'ENG-RC-002',
        comprehension_code: 'RC-001',
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'READING_COMPREHENSION',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.HARD,
        marks: 5,
        negative_marks: 1,
        sort_order: 3,
      },
      {
        question_code: 'ENG-WORD-001',
        comprehension_code: '',
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'VOCABULARY',
        question_type_code: QUESTION_TYPE_CODES.ONE_WORD,
        difficulty: QuestionDifficulty.MEDIUM,
        marks: 5,
        negative_marks: 0,
        sort_order: 4,
      },
      {
        question_code: 'ENG-GRM-001',
        comprehension_code: '',
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'GRAMMAR',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.EASY,
        marks: 5,
        negative_marks: 1,
        sort_order: 5,
      },
    ];
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    this.addImportTemplateReferences(sheet, [
      ['Mode', 'Upload this workbook with the paired Word content file.'],
      [
        'Join key',
        'question_code must appear exactly once in both Word and Excel.',
      ],
      [
        'Excel columns',
        'Edit only columns A:K. Use question_type_code and EASY, MEDIUM, or HARD.',
      ],
      [
        'Word content',
        'Word contains question text, images, options, answers, tolerance, case sensitivity, and explanations.',
      ],
      [
        'One worksheet',
        'Question types, difficulty levels, and instructions are reference blocks on this same sheet.',
      ],
    ]);
    sheet['!autofilter'] = { ref: `A1:K${rows.length + 1}` };
    XLSX.utils.book_append_sheet(workbook, sheet, 'Question Mapping');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  createCodelessExcelImportTemplate() {
    const rows = [
      {
        question_number: 1,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'READING_COMPREHENSION',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.MEDIUM,
        marks: 5,
        negative_marks: 1,
        sort_order: 1,
      },
      {
        question_number: 2,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'READING_COMPREHENSION',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.MEDIUM,
        marks: 5,
        negative_marks: 1,
        sort_order: 2,
      },
      {
        question_number: 3,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'READING_COMPREHENSION',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.HARD,
        marks: 5,
        negative_marks: 1,
        sort_order: 3,
      },
      {
        question_number: 4,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'READING_COMPREHENSION',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.HARD,
        marks: 5,
        negative_marks: 1,
        sort_order: 4,
      },
      {
        question_number: 5,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'READING_COMPREHENSION',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.MEDIUM,
        marks: 5,
        negative_marks: 1,
        sort_order: 5,
      },
      {
        question_number: 6,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'GRAMMAR',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.MEDIUM,
        marks: 5,
        negative_marks: 1,
        sort_order: 6,
      },
      {
        question_number: 7,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'GRAMMAR',
        question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
        difficulty: QuestionDifficulty.EASY,
        marks: 5,
        negative_marks: 1,
        sort_order: 7,
      },
      {
        question_number: 8,
        slot_code: 'CUET_SLOT_1',
        section_code: 'QUANT',
        subject_code: 'MATHEMATICS',
        topic_code: 'PERCENTAGES',
        question_type_code: QUESTION_TYPE_CODES.NUMERIC,
        difficulty: QuestionDifficulty.EASY,
        marks: 5,
        negative_marks: 0,
        sort_order: 1,
      },
      {
        question_number: 9,
        slot_code: 'CUET_SLOT_1',
        section_code: 'LANGUAGE',
        subject_code: 'ENGLISH',
        topic_code: 'VOCABULARY',
        question_type_code: QUESTION_TYPE_CODES.ONE_WORD,
        difficulty: QuestionDifficulty.EASY,
        marks: 5,
        negative_marks: 0,
        sort_order: 8,
      },
    ];
    const nameRows = rows.map(
      ({ slot_code, section_code, subject_code, topic_code, ...row }) => ({
        question_number: row.question_number,
        slot_name: slot_code.replaceAll('_', ' '),
        section_name: section_code.replaceAll('_', ' '),
        subject_name: subject_code.replaceAll('_', ' '),
        topic_name: topic_code.replaceAll('_', ' '),
        question_type_code: row.question_type_code,
        difficulty: row.difficulty,
        marks: row.marks,
        negative_marks: row.negative_marks,
        sort_order: row.sort_order,
      }),
    );
    const workbook = XLSX.utils.book_new();
    const mappingSheet = XLSX.utils.json_to_sheet(nameRows);
    this.addImportTemplateReferences(mappingSheet, [
      ['Mode', 'Upload this workbook with the code-free Word file.'],
      [
        'Join key',
        'Word Q1 matches question_number 1 using slot_name + section_name + question_number.',
      ],
      [
        'Excel columns',
        'Edit only columns A:J. Use question_type_code and EASY, MEDIUM, or HARD.',
      ],
      [
        'Generated codes',
        'Do not add question_code or comprehension_code; internal codes are generated during staging.',
      ],
      [
        'One worksheet',
        'Question types, difficulty levels, and instructions are reference blocks on this same sheet.',
      ],
    ]);
    mappingSheet['!autofilter'] = { ref: `A1:J${nameRows.length + 1}` };
    XLSX.utils.book_append_sheet(workbook, mappingSheet, 'Question Mapping');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async createContextualCodelessExcelImportTemplate(
    user: CurrentUser,
    versionId: number,
  ) {
    const version = await this.prisma.examTemplateVersion.findUnique({
      where: { id: versionId },
      include: {
        examTemplate: true,
        slots: {
          orderBy: { sortOrder: 'asc' },
          include: {
            sections: {
              orderBy: { sortOrder: 'asc' },
              include: {
                subjects: {
                  orderBy: { sortOrder: 'asc' },
                  include: { subject: true },
                },
              },
            },
          },
        },
      },
    });
    if (!version) throw new NotFoundException('Template version not found');
    this.assertOrganization(user, version.examTemplate.organizationId);
    if (version.status !== ExamTemplateVersionStatus.DRAFT)
      throw new ConflictException(
        'Import workbooks can only be generated for a draft template version',
      );
    if (!version.slots.length)
      throw new BadRequestException(
        'Add at least one slot and section before downloading an import workbook',
      );

    let questionNumber = 0;
    const rows = version.slots.flatMap((slot) =>
      slot.sections.flatMap((section) => {
        const subject = section.subjects[0]?.subject;
        if (!subject) return [];
        questionNumber += 1;
        return [
          {
            question_number: questionNumber,
            slot_name: slot.name,
            section_name: section.name,
            subject_name: subject.name,
            topic_name: '',
            question_type_code: QUESTION_TYPE_CODES.SINGLE_CHOICE,
            difficulty: QuestionDifficulty.MEDIUM,
            marks: 1,
            negative_marks: 0,
            sort_order: 1,
          },
        ];
      }),
    );
    if (!rows.length)
      throw new BadRequestException(
        'Every importable section must have a subject before downloading the workbook',
      );

    const workbook = XLSX.utils.book_new();
    const mappingSheet = XLSX.utils.json_to_sheet(rows);
    this.addImportTemplateReferences(mappingSheet, [
      [
        'Template version',
        `${version.examTemplate.name} - v${version.versionNumber}`,
      ],
      [
        'Mapping names',
        'The slot, section, and subject names below come from this exact draft version. Duplicate a starter row for each additional question.',
      ],
      [
        'Join key',
        'Word Q1 matches question_number 1 using slot_name + section_name + question_number.',
      ],
      [
        'Generated codes',
        'Do not add question_code or comprehension_code; internal codes are generated during staging.',
      ],
    ]);
    mappingSheet['!autofilter'] = { ref: `A1:J${rows.length + 1}` };
    XLSX.utils.book_append_sheet(workbook, mappingSheet, 'Question Mapping');

    const structureRows = version.slots.flatMap((slot, slotIndex) =>
      slot.sections.flatMap((section, sectionIndex) =>
        section.subjects.map((subject, subjectIndex) => ({
          slot_order: slotIndex + 1,
          slot_name: slot.name,
          section_order: sectionIndex + 1,
          section_name: section.name,
          subject_order: subjectIndex + 1,
          subject_name: subject.subject.name,
          generated_slot_code: slot.code,
          generated_section_code: section.code,
          generated_subject_code: subject.subject.code,
        })),
      ),
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(structureRows),
      'Structure Reference',
    );
    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
  }

  createCodelessWordImportTemplate() {
    const p = (
      text: string,
      style?:
        | 'TemplateTitle'
        | 'TemplateSubtitle'
        | 'TemplateNote'
        | 'Metadata'
        | 'Heading1'
        | 'Heading2'
        | 'Heading3',
    ) =>
      `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${this.escapeXml(text)}</w:t></w:r></w:p>`;
    const image = (relationshipId: string, id: number, name: string) =>
      `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="3200400" cy="1463040"/><wp:docPr id="${id}" name="${this.escapeXml(name)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${this.escapeXml(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="3200400" cy="1463040"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    const body = [
      p('Code-free Exam Import', 'TemplateTitle'),
      p(
        'Word content template — upload with the matching Excel mapping workbook',
        'TemplateSubtitle',
      ),
      p('FORMAT RULES', 'TemplateNote'),
      p(
        'Use the Heading styles shown below. Do not add question or comprehension codes. Options and answer rules are separate paragraphs; do not use tables. Answer Rules may include a supporting image, but grading values such as Correct Option or Accepted Answers must remain as text.',
        'TemplateNote',
      ),
      p(
        'Slot: Slot 1 | Section: English Language | Subject: English',
        'Metadata',
      ),
      p('Comprehension - 1 to 5', 'Heading1'),
      p(
        'Paste the passage once here. It applies to Q1 through Q5. Text and images can be combined.',
      ),
      image('rId2', 2, 'Comprehension image example'),
      p('Q1.', 'Heading2'),
      p('Choose the word closest in meaning to concise.'),
      image('rId3', 3, 'Question image example'),
      p('Options', 'Heading3'),
      p('A. Brief'),
      p('B. Unclear'),
      p('C. Lengthy'),
      p('D.'),
      image('rId4', 4, 'Option D image example'),
      p('Answer Rules', 'Heading3'),
      p('Correct Option: A'),
      p('Case Sensitive: No'),
      image('rId3', 8, 'Answer Rules supplemental image example'),
      p('Explanation', 'Heading3'),
      p('Concise means brief and clear.'),
      image('rId5', 5, 'Explanation image example'),
      p('Q2.', 'Heading2'),
      p('Which sentence best summarizes the passage?'),
      p('Options', 'Heading3'),
      p('A. A concise message is always informal.'),
      p('B. A concise message expresses the central idea clearly.'),
      p('C. A concise message avoids every detail.'),
      p('D. A concise message must contain an image.'),
      p('Answer Rules', 'Heading3'),
      p('Correct Option: B'),
      p('Case Sensitive: No'),
      p('Explanation', 'Heading3'),
      p('The passage connects concise writing with clarity.'),
      p('Q3.', 'Heading2'),
      p('What should concise writing avoid?'),
      p('Options', 'Heading3'),
      p('A. A central idea'),
      p('B. Clear language'),
      p('C. Unnecessary words'),
      p('D. Useful facts'),
      p('Answer Rules', 'Heading3'),
      p('Correct Option: C'),
      p('Case Sensitive: No'),
      p('Explanation', 'Heading3'),
      p('Concise writing removes unnecessary words.'),
      p('Q4.', 'Heading2'),
      p('Select the statement supported by the passage.'),
      p('Options', 'Heading3'),
      p('A. Longer writing is always clearer.'),
      p('B. Concise writing can communicate clearly.'),
      p('C. Images make all writing concise.'),
      p('D. Details are never useful.'),
      p('Answer Rules', 'Heading3'),
      p('Correct Option: B'),
      p('Case Sensitive: No'),
      p('Explanation', 'Heading3'),
      p('The passage supports clarity through concise expression.'),
      p('Q5.', 'Heading2'),
      p('Choose the opposite of concise.'),
      p('Options', 'Heading3'),
      p('A. Brief'),
      p('B. Clear'),
      p('C. Verbose'),
      p('D. Direct'),
      p('Answer Rules', 'Heading3'),
      p('Correct Option: C'),
      p('Case Sensitive: No'),
      p('Explanation', 'Heading3'),
      p('Verbose is the opposite of concise.'),
      p('Directions - 6 to 7', 'Heading1'),
      p('Study the diagram and select the best answer for each question.'),
      image('rId6', 6, 'Directions image example'),
      p('Q6.', 'Heading2'),
      image('rId7', 7, 'Image-only question example'),
      p('Options', 'Heading3'),
      p('A. First'),
      p('B. Second'),
      p('C. Third'),
      p('D. Fourth'),
      p('Answer Rules', 'Heading3'),
      p('Correct Option: A'),
      p('Case Sensitive: No'),
      p('Explanation', 'Heading3'),
      p('The first item matches the direction shown in the diagram.'),
      p('Q7.', 'Heading2'),
      p('Choose the option that follows the same direction.'),
      p('Options', 'Heading3'),
      p('A. Left'),
      p('B. Right'),
      p('C. Up'),
      p('D. Down'),
      p('Answer Rules', 'Heading3'),
      p('Correct Option: B'),
      p('Case Sensitive: No'),
      p('Explanation', 'Heading3'),
      p('The diagram points to the right.'),
      p('Standalone Questions', 'Heading1'),
      p(
        'Slot: Slot 1 | Section: Quantitative Aptitude | Subject: Mathematics',
        'Metadata',
      ),
      p('Q8.', 'Heading2'),
      p('What is 15% of 240?'),
      p('Answer Rules', 'Heading3'),
      p('Accepted Answers: 36|36.0'),
      p('Numeric Tolerance: 0'),
      p('Explanation', 'Heading3'),
      p('0.15 multiplied by 240 equals 36.'),
      p(
        'Slot: Slot 1 | Section: English Language | Subject: English',
        'Metadata',
      ),
      p('Q9.', 'Heading2'),
      p('Write one word meaning brief and clear.'),
      p('Answer Rules', 'Heading3'),
      p('Accepted Answers: concise|Concise'),
      p('Case Sensitive: No'),
      p('Explanation', 'Heading3'),
      p('Concise means brief and clear.'),
    ].join('');
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const stylesXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="26374D"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="26374D"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TemplateTitle"><w:name w:val="Template Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="0B2545"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TemplateSubtitle"><w:name w:val="Template Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:i/><w:sz w:val="24"/><w:color w:val="53647A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TemplateNote"><w:name w:val="Template Note"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:sz w:val="20"/><w:color w:val="53647A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Metadata"><w:name w:val="Metadata"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="160" w:after="160"/><w:shd w:val="clear" w:color="auto" w:fill="E8EEF5"/><w:ind w:left="120" w:right="120"/></w:pPr><w:rPr><w:b/><w:color w:val="1F4D78"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="200"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="140"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2E74B5"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1F4D78"/></w:rPr></w:style></w:styles>';
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
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/comprehension.png"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/question.png"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/option.png"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/explanation.png"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/directions.png"/><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image-question.png"/></Relationships>',
      },
      {
        name: 'word/media/comprehension.png',
        data: this.createSampleDiagramPng(false),
      },
      {
        name: 'word/media/question.png',
        data: this.createSampleDiagramPng(true),
      },
      {
        name: 'word/media/option.png',
        data: this.createSampleDiagramPng(false),
      },
      {
        name: 'word/media/explanation.png',
        data: this.createSampleDiagramPng(true),
      },
      {
        name: 'word/media/directions.png',
        data: this.createSampleDiagramPng(false),
      },
      {
        name: 'word/media/image-question.png',
        data: this.createSampleDiagramPng(true),
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
      p('Question — ENG-GRM-001', 'Heading2'),
      p('Choose the grammatically correct sentence.'),
      p('Options', 'Heading3'),
      table([
        ['A', { text: 'She writes clearly.' }],
        ['B', { text: 'She write clearly.' }],
        ['C', { text: 'She writing clearly.' }],
        ['D', { text: 'She written clearly.' }],
      ]),
      p('Answer Rules', 'Heading3'),
      answerRules('A', '', '', 'No'),
      p('Explanation', 'Heading3'),
      p(
        'A singular subject takes the verb writes in the simple present tense.',
      ),
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

  private async topicForUser(user: CurrentUser, id: number) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException('Topic not found');
    this.assertOrganization(user, topic.organizationId);
    return topic;
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

  private assertCompleteOrder(
    existingIds: number[],
    orderedIds: number[],
    label: string,
  ) {
    const existing = new Set(existingIds);
    if (
      existingIds.length !== orderedIds.length ||
      orderedIds.some((id) => !existing.has(id))
    ) {
      throw new BadRequestException(
        `The ${label} order must include every current item exactly once`,
      );
    }
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

  private async generateTemplateCode(organizationId: number, name: string) {
    const base = this.normalizeGeneratedCode(name, 'TEMPLATE').slice(0, 52);
    for (let index = 0; index < 100; index += 1) {
      const code = index ? `${base}-${index + 1}` : base;
      const existing = await this.prisma.examTemplate.findFirst({
        where: { organizationId, code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    return `${base}-${Date.now().toString(36).toUpperCase()}`.slice(0, 60);
  }

  private assignStructureCodes(dto: SaveTemplateStructureDto) {
    const slotCodes = new Set<string>();
    dto.slots.forEach((slot, slotIndex) => {
      slot.code = this.uniqueGeneratedCode(
        slot.name || `Slot ${slotIndex + 1}`,
        `SLOT_${slotIndex + 1}`,
        slotCodes,
      );

      const sectionCodes = new Set<string>();
      slot.sections.forEach((section, sectionIndex) => {
        section.code = this.uniqueGeneratedCode(
          section.name || `Section ${sectionIndex + 1}`,
          `SECTION_${sectionIndex + 1}`,
          sectionCodes,
        );
      });
    });
  }

  private uniqueGeneratedCode(
    source: string | undefined,
    fallback: string,
    used: Set<string>,
  ) {
    const base = this.normalizeGeneratedCode(source, fallback).slice(0, 52);
    let code = base;
    let index = 2;
    while (used.has(code)) {
      code = `${base}-${index}`.slice(0, 60);
      index += 1;
    }
    used.add(code);
    return code;
  }

  private normalizeGeneratedCode(source: string | undefined, fallback: string) {
    return normalizeInternalCode(source ?? '', fallback, 60);
  }

  private validateStructure(dto: SaveTemplateStructureDto) {
    const slotNames = dto.slots.map((item) =>
      normalizeInternalLookupKey(item.name),
    );
    if (new Set(slotNames).size !== slotNames.length)
      throw new BadRequestException(
        'Slot names must be unique. Differences in case, spaces, hyphens, or underscores do not create a different slot name',
      );
    const slotCodes = dto.slots.map((item) => item.code!.toUpperCase());
    if (new Set(slotCodes).size !== slotCodes.length)
      throw new BadRequestException('Slot codes must be unique');
    for (const slot of dto.slots) {
      const sectionNames = slot.sections.map((item) =>
        normalizeInternalLookupKey(item.name),
      );
      if (new Set(sectionNames).size !== sectionNames.length)
        throw new BadRequestException(
          `Section names must be unique inside slot ${slot.name}. Differences in case, spaces, hyphens, or underscores do not create a different section name`,
        );
      const sectionCodes = slot.sections.map((item) =>
        item.code!.toUpperCase(),
      );
      if (new Set(sectionCodes).size !== sectionCodes.length)
        throw new BadRequestException(
          `Section codes must be unique inside slot ${slot.name}`,
        );
      const totalSectionTime = slot.sections.reduce(
        (total, section) => total + section.durationMinutes,
        0,
      );
      if (totalSectionTime > slot.durationMinutes)
        throw new BadRequestException(
          `Section timing exceeds slot timing for ${slot.name}`,
        );
      for (const section of slot.sections) {
        const available = section.subjects.reduce(
          (total, subject) => total + subject.questions.length,
          0,
        );
        if (
          available > 0 &&
          section.questionsToAttempt &&
          section.questionsToAttempt > available
        )
          throw new BadRequestException(
            `questionsToAttempt exceeds available questions in ${section.name}`,
          );
      }
    }
  }

  private parseWorkbookMappings(buffer: Buffer): ExcelQuestionMapping[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet)
      throw new BadRequestException(
        'The Excel file does not contain a worksheet. Download a new mapping template and try again.',
      );
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });
    if (!records.length)
      throw new BadRequestException(
        'The Excel file does not contain any question rows. Add at least one question mapping and try again.',
      );
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
      const destinationText = (nameKey: string, legacyCodeKey: string) =>
        text(nameKey) || text(legacyCodeKey);
      const questionTypeCode = text('question_type_code').toUpperCase();
      const marks = numeric('marks', 1) ?? 1;
      const negativeMarks = numeric('negative_marks', 0) ?? 0;
      const sortOrder = numeric('sort_order');
      const difficultyText = text('difficulty').toUpperCase();
      const difficultyValid = Object.values(QuestionDifficulty).includes(
        difficultyText as QuestionDifficulty,
      );
      return {
        sourceRowNumber: index + 2,
        slotCode: destinationText('slot_name', 'slot_code') || undefined,
        sectionCode:
          destinationText('section_name', 'section_code') || undefined,
        subjectCode:
          destinationText('subject_name', 'subject_code') || undefined,
        topicCode: destinationText('topic_name', 'topic_code') || undefined,
        questionCode: text('question_code').toUpperCase(),
        rawQuestionTypeCode: questionTypeCode || undefined,
        legacyQuestionTypeIdPresent: Boolean(text('question_type_id')),
        difficulty: difficultyValid
          ? (difficultyText as QuestionDifficulty)
          : QuestionDifficulty.MEDIUM,
        difficultyInvalid: Boolean(difficultyText && !difficultyValid),
        comprehensionCode:
          text('comprehension_code').toUpperCase() || undefined,
        marks,
        negativeMarks,
        sortOrder:
          sortOrder !== undefined && Number.isInteger(sortOrder)
            ? sortOrder
            : undefined,
        rawData: record,
      };
    });
  }

  private parseCodelessWorkbookMappings(
    buffer: Buffer,
  ): CodelessExcelQuestionMapping[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet)
      throw new BadRequestException(
        'The Excel file does not contain a worksheet. Download a new mapping template and try again.',
      );
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });
    if (!records.length)
      throw new BadRequestException(
        'The Excel file does not contain any question rows. Add at least one question mapping and try again.',
      );
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
      const destinationText = (nameKey: string, legacyCodeKey: string) =>
        text(nameKey) || text(legacyCodeKey);
      const questionNumber = numeric('question_number');
      const questionTypeCode = text('question_type_code').toUpperCase();
      const marks = numeric('marks', 1) ?? 1;
      const negativeMarks = numeric('negative_marks', 0) ?? 0;
      const sortOrder = numeric('sort_order');
      const difficultyText = text('difficulty').toUpperCase();
      const difficultyValid = Object.values(QuestionDifficulty).includes(
        difficultyText as QuestionDifficulty,
      );
      return {
        sourceRowNumber: index + 2,
        slotCode: destinationText('slot_name', 'slot_code') || undefined,
        sectionCode:
          destinationText('section_name', 'section_code') || undefined,
        subjectCode:
          destinationText('subject_name', 'subject_code') || undefined,
        topicCode: destinationText('topic_name', 'topic_code') || undefined,
        questionNumber:
          questionNumber !== undefined &&
          Number.isInteger(questionNumber) &&
          questionNumber > 0
            ? questionNumber
            : undefined,
        questionNumberInvalid:
          questionNumber === undefined ||
          !Number.isInteger(questionNumber) ||
          questionNumber <= 0,
        rawQuestionTypeCode: questionTypeCode || undefined,
        legacyQuestionTypeIdPresent: Boolean(text('question_type_id')),
        difficulty: difficultyValid
          ? (difficultyText as QuestionDifficulty)
          : QuestionDifficulty.MEDIUM,
        difficultyInvalid: Boolean(difficultyText && !difficultyValid),
        marks,
        negativeMarks,
        sortOrder:
          sortOrder !== undefined && Number.isInteger(sortOrder)
            ? sortOrder
            : undefined,
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
    type SharedContext = {
      kind: CodelessSharedContentKind;
      label: string;
      rangeStart: number;
      rangeEnd: number;
      content: string[];
      acceptingContent: boolean;
      rows: CodelessWordQuestionContent[];
    };
    type PendingQuestion = {
      questionNumber: number;
      questionLabel: string;
      section?: SectionContext;
      shared?: SharedContext;
      content: string[];
      options: Array<{ code: string; content: string; isCorrect: boolean }>;
      activeOptionCode?: string;
      correctOption?: string;
      acceptedAnswers: string[];
      tolerance?: number;
      caseSensitive: boolean;
      answerRulesContent: string[];
      explanation: string[];
      mode: 'question' | 'options' | 'answer-rules' | 'explanation';
      answerRulesSeen: boolean;
      explanationSeen: boolean;
      parseErrors: string[];
    };

    const rows: CodelessWordQuestionContent[] = [];
    const sharedContexts: SharedContext[] = [];
    const sharedKeys = new Set<string>();
    let section: SectionContext | undefined;
    let shared: SharedContext | undefined;
    let question: PendingQuestion | undefined;

    const appendOptionContent = (html: string) => {
      if (!question?.activeOptionCode) return false;
      const option = question.options.find(
        (item) => item.code === question?.activeOptionCode,
      );
      if (!option) return false;
      option.content = [option.content, html].filter(Boolean).join('\n');
      return true;
    };

    const applyAnswerRule = (field: string, valueText: string) => {
      if (!question) return;
      const key = field.trim().toLowerCase().replace(/_/g, ' ');
      const ruleValue = valueText.trim();
      if (key === 'correct option' || key === 'correct answer') {
        question.correctOption = ruleValue.toUpperCase() || undefined;
      } else if (key === 'accepted answers' || key === 'accepted answer') {
        question.acceptedAnswers = ruleValue
          .split('|')
          .map((answer) => answer.trim())
          .filter(Boolean);
      } else if (key === 'numeric tolerance' || key === 'tolerance') {
        const tolerance = Number(ruleValue);
        if (ruleValue && Number.isFinite(tolerance))
          question.tolerance = tolerance;
        else if (ruleValue)
          question.parseErrors.push('Numeric Tolerance must be a valid number');
      } else if (key === 'case sensitive') {
        const caseSensitive = this.strictBooleanValue(ruleValue);
        if (caseSensitive === undefined && ruleValue)
          question.parseErrors.push('Case Sensitive must be Yes or No');
        else question.caseSensitive = caseSensitive ?? false;
      } else {
        question.parseErrors.push(
          `Unknown Answer Rules field "${field.trim()}". Use Correct Option, Accepted Answers, Numeric Tolerance, or Case Sensitive`,
        );
      }
    };

    const finishQuestion = () => {
      if (!question) return;
      question.options.forEach((option) => {
        option.isCorrect = option.code === question?.correctOption;
      });
      if (!question.answerRulesSeen)
        question.parseErrors.push('Answer Rules heading is required');
      if (!question.explanationSeen)
        question.parseErrors.push('Explanation heading is required');
      if (
        question.shared &&
        (question.questionNumber < question.shared.rangeStart ||
          question.questionNumber > question.shared.rangeEnd)
      ) {
        question.parseErrors.push(
          `Q${question.questionNumber} is outside the ${question.shared.kind.toLowerCase()} range ${question.shared.rangeStart} to ${question.shared.rangeEnd}`,
        );
      }
      const row: CodelessWordQuestionContent = {
        sourceRowNumber: rows.length + 1,
        ...question.section,
        questionNumber: question.questionNumber,
        questionLabel: question.questionLabel,
        comprehensionLabel: question.shared?.label,
        comprehensionKind: question.shared?.kind,
        comprehensionRangeStart: question.shared?.rangeStart,
        comprehensionRangeEnd: question.shared?.rangeEnd,
        comprehensionContent:
          question.shared?.content.join('\n').trim() || undefined,
        questionContent: question.content.join('\n').trim(),
        answer: question.correctOption,
        tolerance: question.tolerance,
        caseSensitive: question.caseSensitive,
        answerRulesContent:
          question.answerRulesContent.join('\n').trim() || undefined,
        explanation: question.explanation.join('\n').trim() || undefined,
        options: question.options,
        acceptedAnswers: question.acceptedAnswers,
        parseErrors: question.parseErrors,
        rawData: {
          source: 'word',
          format: 'CODELESS_HEADING_PARAGRAPH_V2',
          section: question.section,
          questionLabel: question.questionLabel,
          sharedContent: question.shared
            ? {
                kind: question.shared.kind,
                label: question.shared.label,
                rangeStart: question.shared.rangeStart,
                rangeEnd: question.shared.rangeEnd,
              }
            : null,
          answerRulesContent:
            question.answerRulesContent.join('\n').trim() || null,
          parseErrors: question.parseErrors,
        },
      };
      rows.push(row);
      question.shared?.rows.push(row);
      question = undefined;
    };

    for (const block of blocks) {
      const metadata = this.parseCodelessSectionMetadata(block.text);
      if (metadata) {
        finishQuestion();
        section = metadata;
        shared = undefined;
        continue;
      }

      if (block.tag === 'h1') {
        finishQuestion();
        const rangeHeading = block.text.match(
          /^(comprehension|directions)\s*(?:[\u2013\u2014:|-])\s*(?:q(?:uestion)?\s*)?(\d+)\s*(?:to|[\u2013\u2014-])\s*(?:q(?:uestion)?\s*)?(\d+)\s*\.?$/i,
        );
        if (rangeHeading) {
          const kind =
            rangeHeading[1].toUpperCase() as CodelessSharedContentKind;
          const rangeStart = Number(rangeHeading[2]);
          const rangeEnd = Number(rangeHeading[3]);
          if (
            rangeStart < 1 ||
            rangeEnd < rangeStart ||
            rangeEnd - rangeStart > 499
          )
            throw new BadRequestException(
              `Invalid shared-content range in Heading 1: ${block.text}`,
            );
          const label = `${kind === 'COMPREHENSION' ? 'Comprehension' : 'Directions'} - ${rangeStart} to ${rangeEnd}`;
          const contextKey = [
            section?.slotCode ?? section?.slotTitle ?? '',
            section?.sectionCode ?? section?.sectionTitle ?? '',
            kind,
            rangeStart,
            rangeEnd,
          ]
            .map((part) => this.normalizeLookupKey(String(part)))
            .join(':');
          if (sharedKeys.has(contextKey))
            throw new BadRequestException(
              `${label} must appear only once before its first question`,
            );
          sharedKeys.add(contextKey);
          shared = {
            kind,
            label,
            rangeStart,
            rangeEnd,
            content: [],
            acceptingContent: true,
            rows: [],
          };
          sharedContexts.push(shared);
        } else if (/^standalone questions?$/i.test(block.text)) {
          shared = undefined;
        } else if (/^(comprehension|directions)\b/i.test(block.text)) {
          throw new BadRequestException(
            `Unrecognized Heading 1 "${block.text}". Use Comprehension - 1 to 5 or Directions - 1 to 5`,
          );
        } else if (block.text.trim()) {
          throw new BadRequestException(
            `Unrecognized Heading 1 "${block.text}". Use Comprehension/Directions ranges or Standalone Questions`,
          );
        }
        continue;
      }

      if (block.tag === 'h2') {
        finishQuestion();
        const questionHeading = block.text.match(
          /^(?:q(?:uestion)?\s*)?(\d+)\s*[.)-]?\s*$/i,
        );
        if (!questionHeading)
          throw new BadRequestException(
            `Unrecognized Heading 2 "${block.text}". Use Q1., Q2., and so on`,
          );
        if (shared) shared.acceptingContent = false;
        const questionNumber = Number(questionHeading[1]);
        question = {
          questionNumber,
          questionLabel: `Q${questionNumber}.`,
          section: section ? { ...section } : undefined,
          shared,
          content: [],
          options: [],
          acceptedAnswers: [],
          caseSensitive: false,
          answerRulesContent: [],
          explanation: [],
          mode: 'question',
          answerRulesSeen: false,
          explanationSeen: false,
          parseErrors:
            questionNumber > 0
              ? []
              : ['Question number must be a positive integer'],
        };
        continue;
      }

      if (block.tag === 'h3' && question) {
        const heading = block.text.trim().toLowerCase();
        question.activeOptionCode = undefined;
        if (heading === 'options') question.mode = 'options';
        else if (heading === 'answer rules') {
          question.mode = 'answer-rules';
          question.answerRulesSeen = true;
        } else if (heading === 'explanation') {
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
        if (question.mode === 'options') {
          if (block.tag === 'table') {
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
              question.activeOptionCode = code;
            }
            continue;
          }
          const optionMatch = block.text.match(
            /^(?:option\s+)?([A-Z0-9]+)\s*[.)\-:]\s*(.*)$/i,
          );
          if (optionMatch) {
            const code = optionMatch[1].toUpperCase();
            const plainContent = optionMatch[2].trim();
            const marker = new RegExp(
              `^(?:option\\s+)?${optionMatch[1]}\\s*[.)\\-:]\\s*`,
              'i',
            );
            const richInner = block.innerHtml.replace(marker, '').trim();
            const content = /<img\b/i.test(richInner)
              ? `<p>${richInner}</p>`
              : plainContent;
            question.options.push({ code, content, isCorrect: false });
            question.activeOptionCode = code;
          } else if (!appendOptionContent(block.html) && block.text.trim()) {
            question.parseErrors.push(
              'Each option must start on a new line with a label such as A.',
            );
          }
          continue;
        }

        if (question.mode === 'answer-rules') {
          if (block.tag === 'table') {
            for (const cells of this.tableRows(block.innerHtml)) {
              if (cells.length >= 2)
                applyAnswerRule(
                  this.htmlText(cells[0]),
                  this.htmlText(cells[1]),
                );
            }
            if (/<img\b/i.test(block.html))
              question.answerRulesContent.push(block.html);
            continue;
          }
          const rule = block.text.match(/^([^:]+):\s*(.*)$/);
          if (rule) applyAnswerRule(rule[1], rule[2]);
          else if (block.text.trim())
            question.parseErrors.push(
              `Unrecognized Answer Rules line "${block.text}"`,
            );
          if (/<img\b/i.test(block.html))
            question.answerRulesContent.push(block.html);
          continue;
        }

        if (question.mode === 'explanation') {
          question.explanation.push(block.html);
          continue;
        }
        if (question.mode === 'question') question.content.push(block.html);
      } else if (shared?.acceptingContent) {
        shared.content.push(block.html);
      }
    }

    finishQuestion();

    for (const context of sharedContexts) {
      const actual = new Set(context.rows.map((row) => row.questionNumber));
      const missing: number[] = [];
      for (
        let questionNumber = context.rangeStart;
        questionNumber <= context.rangeEnd;
        questionNumber += 1
      ) {
        if (!actual.has(questionNumber)) missing.push(questionNumber);
      }
      if (missing.length) {
        const message = `${context.label} is missing ${missing
          .map((number) => `Q${number}`)
          .join(', ')}`;
        if (context.rows[0]?.parseErrors)
          context.rows[0].parseErrors.push(message);
        else throw new BadRequestException(message);
      }
    }

    if (!rows.length)
      throw new BadRequestException(
        'No questions were found. Apply Heading 2 to headings such as Q1.',
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
    const parts = text.split('|').map((part) => part.trim());
    if (!parts.some((part) => /^(slot|section|subject)\s*:/i.test(part)))
      return undefined;
    const metadata: {
      sectionTitle?: string;
      slotTitle?: string;
      subjectTitle?: string;
      sectionCode?: string;
      slotCode?: string;
      subjectCode?: string;
    } = {};
    for (const [index, part] of parts.entries()) {
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
    structure: ImportTemplateStructure,
    word: CodelessWordQuestionContent,
  ) {
    return this.resolveNamedDestination(
      structure,
      word.slotCode,
      word.sectionCode,
      word.subjectCode,
      word.slotTitle,
      word.sectionTitle,
      word.subjectTitle,
    );
  }

  private resolveNamedDestination(
    structure: ImportTemplateStructure,
    slotValue?: string,
    sectionValue?: string,
    subjectValue?: string,
    slotTitle?: string,
    sectionTitle?: string,
    subjectTitle?: string,
  ) {
    const slot =
      this.findTemplateItem(structure, slotValue, slotTitle) ??
      (structure.length === 1 ? structure[0] : undefined);
    const sectionPool = slot
      ? slot.sections
      : structure.flatMap((item) => item.sections);
    const section = this.findTemplateItem(
      sectionPool,
      sectionValue,
      sectionTitle,
    );
    const resolvedSlot =
      slot ??
      (section
        ? structure.find((item) =>
            item.sections.some((sectionItem) => sectionItem === section),
          )
        : undefined);
    const subjectPool = section?.subjects ?? [];
    const subject =
      this.findTemplateItem(
        subjectPool.map((item) => item.subject),
        subjectValue,
        subjectTitle,
      ) ?? (subjectPool.length === 1 ? subjectPool[0].subject : undefined);
    return { slot: resolvedSlot, section, subject };
  }

  private findTemplateItem<T extends { code: string; name: string }>(
    items: T[],
    ...values: Array<string | undefined>
  ) {
    const candidates = values
      .map((value) => value?.trim())
      .filter(Boolean) as string[];
    for (const candidate of candidates) {
      const exactCodeMatches = items.filter(
        (item) => item.code.trim().toUpperCase() === candidate.toUpperCase(),
      );
      if (exactCodeMatches.length === 1) return exactCodeMatches[0];
    }
    const lookupKeys = new Set(
      candidates.map((candidate) => normalizeInternalLookupKey(candidate)),
    );
    const matches = items.filter(
      (item) =>
        lookupKeys.has(normalizeInternalLookupKey(item.code)) ||
        lookupKeys.has(normalizeInternalLookupKey(item.name)),
    );
    return matches.length === 1 ? matches[0] : undefined;
  }

  private matchesTemplateText(
    item: { code: string; name: string },
    code?: string,
    title?: string,
  ) {
    return Boolean(this.findTemplateItem([item], code, title));
  }

  private codelessComprehensionCode(
    existing: Map<string, string>,
    destinationPrefix: string,
    kind: CodelessSharedContentKind,
    rangeStart: number,
    rangeEnd: number,
  ) {
    const key = `${destinationPrefix}:${kind}:${rangeStart}:${rangeEnd}`;
    const current = existing.get(key);
    if (current) return current;
    const suffix = `-${kind === 'DIRECTIONS' ? 'DIR' : 'COMP'}-${rangeStart}-${rangeEnd}`;
    const code = `${destinationPrefix.slice(0, 80 - suffix.length)}${suffix}`;
    existing.set(key, code);
    return code;
  }

  private codelessQuestionCode(
    versionId: number,
    slotCode: string,
    sectionCode: string,
    questionNumber: number,
  ) {
    const versionPrefix = `V${versionId}-`;
    const suffix = `-Q${String(questionNumber).padStart(3, '0')}`;
    const prefix =
      this.cleanImportCode(`${slotCode}_${sectionCode}`) || 'QUESTION';
    return `${versionPrefix}${prefix.slice(
      0,
      80 - versionPrefix.length - suffix.length,
    )}${suffix}`;
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
    return normalizeInternalLookupKey(value);
  }

  private importValidationMessage(sourceRowNumber: number, errors: string[]) {
    const messages = [...new Set(errors.map((error) => error.trim()))]
      .filter(Boolean)
      .map((message) => {
        const sentence = message.replace(/[.;\s]+$/g, '');
        return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
      });
    return messages.length
      ? `Import row ${sourceRowNumber}: ${messages.join(' ')}`
      : undefined;
  }

  private mergeImportFiles(
    wordRows: WordQuestionContent[],
    excelRows: ExcelQuestionMapping[],
    questionTypes: ImportQuestionType[],
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
    const typeByCode = new Map(
      questionTypes.map((type) => [type.code.trim().toUpperCase(), type]),
    );
    return codes.map((code, index) => {
      const words = wordByCode.get(code) ?? [];
      const mappings = excelByCode.get(code) ?? [];
      const word = words[0];
      const mapping = mappings[0];
      const requestedType = mapping?.rawQuestionTypeCode
        ? typeByCode.get(mapping.rawQuestionTypeCode)
        : undefined;
      const type =
        requestedType?.isActive === false ? undefined : requestedType;
      const errors: string[] = [...(word?.parseErrors ?? [])];
      if (!code)
        errors.push('Enter question_code in both the Word and Excel files');
      if (!word)
        errors.push(
          `No Word question matches question_code "${code || '(blank)'}"`,
        );
      if (!mapping)
        errors.push(
          `No Excel row matches question_code "${code || '(blank)'}"`,
        );
      if (words.length > 1)
        errors.push(
          `question_code "${code}" appears more than once in the Word file`,
        );
      if (mappings.length > 1)
        errors.push(
          `question_code "${code}" appears more than once in the Excel file`,
        );
      if (mapping?.legacyQuestionTypeIdPresent && !mapping.rawQuestionTypeCode)
        errors.push(
          'The old question_type_id column is no longer accepted. Rename it to question_type_code and enter a production code such as SINGLE_CHOICE',
        );
      else if (mapping && !mapping.rawQuestionTypeCode)
        errors.push(
          'Enter question_type_code in Excel, for example SINGLE_CHOICE, NUMERIC, or ONE_WORD',
        );
      else if (mapping?.rawQuestionTypeCode && !requestedType)
        errors.push(
          `Question type code "${mapping.rawQuestionTypeCode}" is not recognized. Copy a code from the Question Types reference block in the workbook`,
        );
      else if (requestedType?.isActive === false)
        errors.push(
          `Question type "${requestedType.code}" is not available for import yet. Choose an available type`,
        );
      if (mapping?.difficultyInvalid)
        errors.push('Choose EASY, MEDIUM, or HARD in the difficulty column');
      if (!word || !this.hasRichContent(word.questionContent))
        errors.push('Add the question text or image in the Word file');
      if (
        word?.comprehensionCode &&
        !this.hasRichContent(word.comprehensionContent ?? '')
      )
        errors.push('Add text or an image to the Word comprehension content');
      if (!Number.isFinite(mapping?.marks) || (mapping?.marks ?? -1) < 0)
        errors.push('Enter marks as 0 or a positive number in Excel');
      if (
        !Number.isFinite(mapping?.negativeMarks) ||
        (mapping?.negativeMarks ?? -1) < 0
      )
        errors.push('Enter negative_marks as 0 or a positive number in Excel');
      if (
        word &&
        mapping &&
        (word.comprehensionCode ?? '') !== (mapping.comprehensionCode ?? '')
      )
        errors.push(
          'Use the same comprehension_code in the Word and Excel files',
        );
      if (word) {
        const optionCodes = word.options.map((option) => option.code);
        if (new Set(optionCodes).size !== optionCodes.length)
          errors.push('Use each option code only once in the Word question');
        if (word.options.some((option) => !this.hasRichContent(option.content)))
          errors.push('Add text or an image to every Word option');
      }
      if (type?.code === QUESTION_TYPE_CODES.SINGLE_CHOICE) {
        if (
          !word ||
          word.options.length < 2 ||
          word.options.filter((option) => option.isCorrect).length !== 1
        )
          errors.push(
            'Single-answer questions need at least two options and exactly one Correct Option in Word',
          );
        if (
          word?.answer &&
          !word.options.some((option) => option.code === word.answer)
        )
          errors.push('Correct Option must match one of the Word option codes');
      } else if (type?.code === QUESTION_TYPE_CODES.NUMERIC) {
        if (!word?.acceptedAnswers.length)
          errors.push(
            'Add at least one Accepted Answer for the numeric question in Word',
          );
        if (
          word?.acceptedAnswers.some(
            (answer) => !Number.isFinite(Number(answer)),
          )
        )
          errors.push(
            'Every Accepted Answer for a numeric question must be a number',
          );
        if ((word?.tolerance ?? 0) < 0)
          errors.push('Numeric Tolerance must be 0 or a positive number');
      } else if (
        type?.code === QUESTION_TYPE_CODES.ONE_WORD &&
        !word?.acceptedAnswers.length
      ) {
        errors.push(
          'Add at least one Accepted Answer for the one-word question in Word',
        );
      }
      const sourceRowNumber =
        mapping?.sourceRowNumber ?? word?.sourceRowNumber ?? index + 1;
      return {
        sourceRowNumber,
        slotCode: mapping?.slotCode,
        sectionCode: mapping?.sectionCode,
        subjectCode: mapping?.subjectCode,
        topicCode: mapping?.topicCode,
        questionCode: code,
        questionTypeId: type?.id,
        rawQuestionTypeId: requestedType?.id,
        rawQuestionTypeCode: mapping?.rawQuestionTypeCode,
        difficulty: mapping?.difficulty ?? QuestionDifficulty.MEDIUM,
        comprehensionCode:
          word?.comprehensionCode ?? mapping?.comprehensionCode,
        comprehensionContent: word?.comprehensionContent,
        questionContent: word?.questionContent ?? '',
        marks: mapping?.marks ?? 0,
        negativeMarks: mapping?.negativeMarks ?? 0,
        sortOrder: mapping?.sortOrder,
        isMandatory: true,
        answer: word?.answer,
        tolerance: word?.tolerance,
        caseSensitive: word?.caseSensitive ?? false,
        explanation: word?.explanation,
        options: word?.options ?? [],
        acceptedAnswers: word?.acceptedAnswers ?? [],
        status: errors.length
          ? ExamImportRowStatus.ERROR
          : ExamImportRowStatus.VALID,
        validationMessage: this.importValidationMessage(
          sourceRowNumber,
          errors,
        ),
        rawData: {
          word: word?.rawData ?? null,
          excel: mapping?.rawData ?? null,
        },
      };
    });
  }

  private async buildCodelessWordRows(
    buffer: Buffer,
    excelRows: CodelessExcelQuestionMapping[],
    versionId: number,
    dto: CreateExamImportDto,
    questionTypes: ImportQuestionType[],
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
      questionTypes.map((type) => [type.code.trim().toUpperCase(), type]),
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
    const joinKey = (
      slotCode: string | undefined,
      sectionCode: string | undefined,
      questionNumber: number | undefined,
      fallback: string,
    ) =>
      slotCode && sectionCode && questionNumber
        ? `${slotCode.trim().toUpperCase()}:${sectionCode
            .trim()
            .toUpperCase()}:${questionNumber}`
        : fallback;

    const resolvedWords = wordRows.map((word) => {
      const destination =
        dto.scope === ExamImportScope.SINGLE_SECTION
          ? {
              slot: selectedSlot,
              section: selectedSection,
              subject: selectedSubject,
            }
          : this.resolveCodelessDestination(structure, word);
      const slotCode = destination.slot?.code ?? word.slotCode;
      const sectionCode = destination.section?.code ?? word.sectionCode;
      return {
        word,
        destination,
        key: joinKey(
          slotCode,
          sectionCode,
          word.questionNumber,
          `WORD:${word.sourceRowNumber}`,
        ),
      };
    });
    const resolvedExcel = excelRows.map((mapping) => {
      const destination =
        dto.scope === ExamImportScope.SINGLE_SECTION
          ? {
              slot:
                selectedSlot &&
                this.matchesTemplateText(
                  selectedSlot,
                  mapping.slotCode,
                  mapping.slotCode,
                )
                  ? selectedSlot
                  : undefined,
              section:
                selectedSection &&
                this.matchesTemplateText(
                  selectedSection,
                  mapping.sectionCode,
                  mapping.sectionCode,
                )
                  ? selectedSection
                  : undefined,
              subject:
                selectedSubject &&
                this.matchesTemplateText(
                  selectedSubject,
                  mapping.subjectCode,
                  mapping.subjectCode,
                )
                  ? selectedSubject
                  : undefined,
            }
          : this.resolveNamedDestination(
              structure,
              mapping.slotCode,
              mapping.sectionCode,
              mapping.subjectCode,
            );
      const canonicalMapping = {
        ...mapping,
        slotCode: destination.slot?.code ?? mapping.slotCode,
        sectionCode: destination.section?.code ?? mapping.sectionCode,
        subjectCode: destination.subject?.code ?? mapping.subjectCode,
      };
      return {
        mapping: canonicalMapping,
        key: joinKey(
          canonicalMapping.slotCode,
          canonicalMapping.sectionCode,
          canonicalMapping.questionNumber,
          `EXCEL:${mapping.sourceRowNumber}`,
        ),
      };
    });
    const wordsByKey = new Map<string, (typeof resolvedWords)[number][]>();
    const excelByKey = new Map<string, (typeof resolvedExcel)[number][]>();
    for (const item of resolvedWords) {
      const bucket = wordsByKey.get(item.key) ?? [];
      bucket.push(item);
      wordsByKey.set(item.key, bucket);
    }
    for (const item of resolvedExcel) {
      const bucket = excelByKey.get(item.key) ?? [];
      bucket.push(item);
      excelByKey.set(item.key, bucket);
    }
    const keys = [
      ...new Set([
        ...resolvedExcel.map((item) => item.key),
        ...resolvedWords.map((item) => item.key),
      ]),
    ];
    const comprehensionCodes = new Map<string, string>();
    let nextSyntheticSourceRowNumber =
      excelRows.reduce(
        (maximum, mapping) => Math.max(maximum, mapping.sourceRowNumber),
        0,
      ) + 1;

    return keys.map((key, index) => {
      const wordMatches = wordsByKey.get(key) ?? [];
      const excelMatches = excelByKey.get(key) ?? [];
      const resolvedWord = wordMatches[0];
      const word = resolvedWord?.word;
      const mapping = excelMatches[0]?.mapping;
      const questionNumber =
        mapping?.questionNumber ?? word?.questionNumber ?? index + 1;
      const slotCode =
        mapping?.slotCode ??
        resolvedWord?.destination.slot?.code ??
        word?.slotCode ??
        '';
      const sectionCode =
        mapping?.sectionCode ??
        resolvedWord?.destination.section?.code ??
        word?.sectionCode ??
        '';
      const subjectCode =
        mapping?.subjectCode ??
        resolvedWord?.destination.subject?.code ??
        word?.subjectCode;
      const questionCode = this.codelessQuestionCode(
        versionId,
        slotCode || 'SLOT',
        sectionCode || 'SECTION',
        questionNumber,
      );
      const requestedType = mapping?.rawQuestionTypeCode
        ? typeByCode.get(mapping.rawQuestionTypeCode)
        : undefined;
      const type =
        requestedType?.isActive === false ? undefined : requestedType;
      const errors: string[] = [...(word?.parseErrors ?? [])];

      if (!word)
        errors.push(
          `No Word question matches slot "${slotCode || '(blank)'}", section "${sectionCode || '(blank)'}", and question_number "${questionNumber}"`,
        );
      if (!mapping)
        errors.push(
          `No Excel row matches slot "${slotCode || '(blank)'}", section "${sectionCode || '(blank)'}", and question_number "${questionNumber}"`,
        );
      if (wordMatches.length > 1)
        errors.push(
          `The Word file contains more than one Q${questionNumber} for this slot and section`,
        );
      if (excelMatches.length > 1)
        errors.push(
          `The Excel file contains more than one row for question_number ${questionNumber} in this slot and section`,
        );
      if (mapping?.questionNumberInvalid)
        errors.push(
          'Enter question_number as a positive whole number in Excel',
        );
      if (!mapping?.slotCode) errors.push('Enter slot_name in Excel');
      if (!mapping?.sectionCode) errors.push('Enter section_name in Excel');
      if (!mapping?.subjectCode) errors.push('Enter subject_name in Excel');
      if (mapping?.legacyQuestionTypeIdPresent && !mapping.rawQuestionTypeCode)
        errors.push(
          'The old question_type_id column is no longer accepted. Rename it to question_type_code and enter a production code such as SINGLE_CHOICE',
        );
      else if (mapping && !mapping.rawQuestionTypeCode)
        errors.push(
          'Enter question_type_code in Excel, for example SINGLE_CHOICE, NUMERIC, or ONE_WORD',
        );
      else if (mapping?.rawQuestionTypeCode && !requestedType)
        errors.push(
          `Question type code "${mapping.rawQuestionTypeCode}" is not recognized. Copy a code from the Question Types reference block in the workbook`,
        );
      else if (requestedType?.isActive === false)
        errors.push(
          `Question type "${requestedType.code}" is not available for import yet. Choose an available type`,
        );
      if (mapping?.difficultyInvalid)
        errors.push('Choose EASY, MEDIUM, or HARD in the difficulty column');
      if (!word || !this.hasRichContent(word.questionContent))
        errors.push('Add the question text or image in the Word file');
      if (
        word?.comprehensionLabel &&
        !this.hasRichContent(word.comprehensionContent ?? '')
      )
        errors.push(
          'Add text or an image to the Word comprehension or directions block',
        );
      if (!Number.isFinite(mapping?.marks) || (mapping?.marks ?? -1) < 0)
        errors.push('Enter marks as 0 or a positive number in Excel');
      if (
        !Number.isFinite(mapping?.negativeMarks) ||
        (mapping?.negativeMarks ?? -1) < 0
      )
        errors.push('Enter negative_marks as 0 or a positive number in Excel');
      if (
        word &&
        mapping?.subjectCode &&
        resolvedWord?.destination.subject?.code &&
        mapping.subjectCode !==
          resolvedWord.destination.subject.code.toUpperCase()
      )
        errors.push(
          'subject_name in Excel does not match the destination written in Word',
        );

      const optionCodes = word?.options.map((option) => option.code) ?? [];
      if (new Set(optionCodes).size !== optionCodes.length)
        errors.push('Use each option label only once in the Word question');
      if (word?.options.some((option) => !this.hasRichContent(option.content)))
        errors.push('Add text or an image to every Word option');
      if (type?.code === QUESTION_TYPE_CODES.SINGLE_CHOICE) {
        if (
          (word?.options.length ?? 0) < 2 ||
          word?.options.filter((option) => option.isCorrect).length !== 1
        )
          errors.push(
            'Single-answer questions need at least two options and exactly one Correct Option in Word',
          );
        if (
          word?.answer &&
          !word.options.some((option) => option.code === word.answer)
        )
          errors.push(
            'Correct Option must match one of the Word option labels',
          );
      } else if (type?.code === QUESTION_TYPE_CODES.NUMERIC) {
        if (!word?.acceptedAnswers.length)
          errors.push(
            'Add at least one Accepted Answer for the numeric question in Word',
          );
        if (
          word?.acceptedAnswers.some(
            (answer) => !Number.isFinite(Number(answer)),
          )
        )
          errors.push(
            'Every Accepted Answer for a numeric question must be a number',
          );
        if ((word?.tolerance ?? 0) < 0)
          errors.push('Numeric Tolerance must be 0 or a positive number');
      } else if (
        type?.code === QUESTION_TYPE_CODES.ONE_WORD &&
        !word?.acceptedAnswers.length
      ) {
        errors.push(
          'Add at least one Accepted Answer for the one-word question in Word',
        );
      }

      const destinationPrefix =
        this.cleanImportCode(
          [`V${versionId}`, slotCode, sectionCode, subjectCode]
            .filter(Boolean)
            .join('_'),
        ) || 'SHARED_CONTENT';
      const comprehensionCode =
        word?.comprehensionKind &&
        word.comprehensionRangeStart &&
        word.comprehensionRangeEnd
          ? this.codelessComprehensionCode(
              comprehensionCodes,
              destinationPrefix,
              word.comprehensionKind,
              word.comprehensionRangeStart,
              word.comprehensionRangeEnd,
            )
          : undefined;

      const sourceRowNumber =
        mapping?.sourceRowNumber ?? nextSyntheticSourceRowNumber++;

      return {
        sourceRowNumber,
        slotCode: mapping?.slotCode,
        sectionCode: mapping?.sectionCode,
        subjectCode: mapping?.subjectCode,
        topicCode: mapping?.topicCode,
        questionCode,
        questionTypeId: type?.id,
        rawQuestionTypeId: requestedType?.id,
        rawQuestionTypeCode: mapping?.rawQuestionTypeCode,
        difficulty: mapping?.difficulty ?? QuestionDifficulty.MEDIUM,
        comprehensionCode,
        comprehensionContent: word?.comprehensionContent,
        questionContent: word?.questionContent ?? '',
        marks: mapping?.marks ?? 0,
        negativeMarks: mapping?.negativeMarks ?? 0,
        sortOrder: mapping?.sortOrder,
        isMandatory: true,
        answer: word?.answer,
        tolerance: word?.tolerance,
        caseSensitive: word?.caseSensitive ?? false,
        explanation: word?.explanation,
        options: word?.options ?? [],
        acceptedAnswers: word?.acceptedAnswers ?? [],
        status: errors.length
          ? ExamImportRowStatus.ERROR
          : ExamImportRowStatus.VALID,
        validationMessage: this.importValidationMessage(
          sourceRowNumber,
          errors,
        ),
        rawData: {
          word: word?.rawData ?? null,
          excel: mapping?.rawData ?? null,
          importMode: ExamImportMode.CODELESS_WORD,
          answerRulesContent: word?.answerRulesContent ?? null,
          generated: {
            joinKey: key,
            questionCode,
            comprehensionCode,
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
    const topics = await this.prisma.topic.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, subjectId: true, code: true, name: true },
    });
    const existingQuestions = await this.prisma.question.findMany({
      where: {
        organizationId,
        code: { in: rows.map((row) => row.questionCode).filter(Boolean) },
      },
      select: { code: true, subjectId: true },
    });
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
      const existingValidationMessage = row.validationMessage;
      const errors: string[] = [];
      const questionCode = row.questionCode.toUpperCase();
      if (seen.has(questionCode))
        errors.push(
          `Question code "${row.questionCode}" appears more than once in this import. Use a unique question code for every row`,
        );
      seen.add(questionCode);
      const matchedSlot =
        dto.scope === ExamImportScope.FULL_EXAM
          ? this.findTemplateItem(structure, row.slotCode)
          : selectedSlot &&
              this.matchesTemplateText(selectedSlot, row.slotCode, row.slotCode)
            ? selectedSlot
            : undefined;
      const matchedSection =
        dto.scope === ExamImportScope.FULL_EXAM
          ? matchedSlot
            ? this.findTemplateItem(matchedSlot.sections, row.sectionCode)
            : undefined
          : selectedSection &&
              this.matchesTemplateText(
                selectedSection,
                row.sectionCode,
                row.sectionCode,
              )
            ? selectedSection
            : undefined;
      const matchedSubject =
        dto.scope === ExamImportScope.FULL_EXAM
          ? this.findTemplateItem(subjects, row.subjectCode)
          : selectedSubject &&
              this.matchesTemplateText(
                selectedSubject,
                row.subjectCode,
                row.subjectCode,
              )
            ? selectedSubject
            : undefined;
      const existingSubjectId = existingQuestionCodes.get(questionCode);
      const intendedSubjectId =
        dto.scope === ExamImportScope.SINGLE_SECTION
          ? dto.subjectId
          : matchedSubject?.id;
      if (row.topicCode) {
        const matchedTopic = intendedSubjectId
          ? this.findTemplateItem(
              topics.filter((topic) => topic.subjectId === intendedSubjectId),
              row.topicCode,
            )
          : undefined;
        row.topicId = matchedTopic?.id;
        if (matchedTopic) row.topicCode = matchedTopic.code;
        else {
          errors.push(
            `Topic "${row.topicCode}" was not found for subject "${row.subjectCode ?? ''}". Correct the topic name or leave it blank`,
          );
        }
      }
      if (existingSubjectId !== undefined)
        errors.push(
          existingSubjectId === intendedSubjectId
            ? `Question code "${row.questionCode}" already exists in the question bank. Imports can only create new questions`
            : `Question code "${row.questionCode}" already belongs to another subject. Use a new question code`,
        );
      if (dto.scope === ExamImportScope.FULL_EXAM) {
        if (!matchedSlot)
          errors.push(
            `Slot "${row.slotCode ?? ''}" was not found in this template version`,
          );
        if (!matchedSection)
          errors.push(
            `Section "${row.sectionCode ?? ''}" was not found under slot "${row.slotCode ?? ''}"`,
          );
        if (!matchedSubject)
          errors.push(
            `Subject "${row.subjectCode ?? ''}" was not found in this organization`,
          );
        if (matchedSection && matchedSection.subjects.length !== 1)
          errors.push(
            `Section "${matchedSection.name}" must contain exactly one subject before questions can be imported`,
          );
        else if (
          matchedSection &&
          matchedSubject &&
          matchedSection.subjects[0].subject.id !== matchedSubject.id
        )
          errors.push(
            `Use subject "${matchedSection.subjects[0].subject.name}" for section "${matchedSection.name}"`,
          );
      } else {
        if (
          !selectedSlot ||
          !selectedSection ||
          (dto.examTemplateSlotId && selectedSlot.id !== dto.examTemplateSlotId)
        )
          errors.push(
            'The selected destination section is no longer part of this template version. Refresh the page and select it again',
          );
        if (!selectedSection || selectedSection.subjects.length !== 1)
          errors.push(
            'The selected destination section must contain exactly one subject',
          );
        if (
          !selectedSubject ||
          selectedSubject.organizationId !== organizationId ||
          selectedSubject.id !== dto.subjectId
        )
          errors.push(
            'The selected destination subject is not available for this organization. Refresh the page and select it again',
          );
        if (selectedSlot && !matchedSlot)
          errors.push(
            `Use slot "${selectedSlot.name}" for the selected section`,
          );
        if (selectedSection && !matchedSection)
          errors.push(
            `Use section "${selectedSection.name}" for the selected destination`,
          );
        if (selectedSubject && !matchedSubject)
          errors.push(
            `Use subject "${selectedSubject.name}" for section "${selectedSection?.name ?? ''}"`,
          );
      }
      if (matchedSlot) row.slotCode = matchedSlot.code;
      if (matchedSection) row.sectionCode = matchedSection.code;
      if (matchedSubject) row.subjectCode = matchedSubject.code;
      if (errors.length) {
        row.status = ExamImportRowStatus.ERROR;
        row.validationMessage = [
          existingValidationMessage,
          this.importValidationMessage(row.sourceRowNumber, errors),
        ]
          .filter(Boolean)
          .join(' ');
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
          'destination-names-v2',
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

  private rethrowImportStagingError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new BadRequestException(
        'We could not prepare the import preview because duplicate row or file references were detected. Check that each Excel question_number is unique within its slot and section, then try again.',
      );
    throw error;
  }
}
