import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ExamImportScope,
  ExamNavigationMode,
  ExamResultReleaseMode,
  ExamStatus,
  ExamTemplateStatus,
  ExamVirtualKeyboardMode,
  QuestionDifficulty,
  QuestionStatus,
} from '@prisma/client';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export enum ExamImportMode {
  PAIRED_WORD_EXCEL = 'PAIRED_WORD_EXCEL',
  CODELESS_WORD = 'CODELESS_WORD',
}

export class OrganizationScopedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;
}

export enum QuestionListSort {
  LATEST = 'LATEST',
  OLDEST = 'OLDEST',
  CODE = 'CODE',
  RECENTLY_UPDATED = 'RECENTLY_UPDATED',
}

export class QuestionListQueryDto extends OrganizationScopedQueryDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionTypeId?: number;

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsEnum(QuestionListSort)
  sort: QuestionListSort = QuestionListSort.LATEST;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class TemplateListQueryDto extends OrganizationScopedQueryDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(ExamTemplateStatus)
  status?: ExamTemplateStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class CreateSubjectDto extends OrganizationScopedQueryDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code?: string;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSubjectDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TopicListQueryDto extends OrganizationScopedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;

  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @IsBoolean()
  includeInactive = false;
}

export class CreateTopicDto extends OrganizationScopedQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId!: number;

  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  code?: string;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateTopicDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QuestionOptionDto {
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code!: string;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuestionDto extends OrganizationScopedQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topicId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionTypeId!: number;

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  defaultMarks!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  defaultNegativeMarks!: number;

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @IsOptional()
  @IsBoolean()
  normalizeWhitespace?: boolean;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acceptedAnswers?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numericTolerance?: number;

  @IsOptional()
  @IsEnum(ExamVirtualKeyboardMode)
  virtualKeyboardMode?: ExamVirtualKeyboardMode;

  @IsOptional()
  @IsBoolean()
  allowPhysicalKeyboard?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPaste?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  maxAnswerLength?: number;
}

export class CreateExamTemplateDto extends OrganizationScopedQueryDto {
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  defaultDurationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  defaultAttemptLimit?: number;

  @IsOptional()
  @IsBoolean()
  enforceSlotTimers?: boolean;

  @IsOptional()
  @IsBoolean()
  enforceSectionTimers?: boolean;
}

export class UpdateExamTemplateDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TemplateQuestionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionVersionId!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  marks!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  negativeMarks!: number;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class TemplateSubjectDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId!: number;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateQuestionDto)
  questions!: TemplateQuestionDto[];
}

export class TemplateSectionDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  code?: string;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionsToAttempt?: number;

  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  randomizeOptions?: boolean;

  @IsOptional()
  @IsEnum(ExamNavigationMode)
  navigationMode?: ExamNavigationMode;

  @IsOptional()
  @IsBoolean()
  allowReview?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSubmitOnTimeout?: boolean;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Each section must contain exactly one subject',
  })
  @ArrayMaxSize(1, {
    message: 'Each section must contain exactly one subject',
  })
  @ValidateNested({ each: true })
  @Type(() => TemplateSubjectDto)
  subjects!: TemplateSubjectDto[];
}

export class TemplateSlotDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  code?: string;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsEnum(ExamNavigationMode)
  navigationMode?: ExamNavigationMode;

  @IsOptional()
  @IsBoolean()
  autoSubmitOnTimeout?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateSectionDto)
  sections!: TemplateSectionDto[];
}

export class SaveTemplateStructureDto {
  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  defaultDurationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  defaultAttemptLimit?: number;

  @IsOptional()
  @IsBoolean()
  enforceSlotTimers?: boolean;

  @IsOptional()
  @IsBoolean()
  enforceSectionTimers?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateSlotDto)
  slots!: TemplateSlotDto[];
}

export class CreateExamDto extends OrganizationScopedQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  examTemplateVersionId!: number;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsDateString()
  availableFrom!: string;

  @IsDateString()
  availableUntil!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  attemptLimit!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  passingPercentage?: number;

  @IsOptional()
  @IsBoolean()
  autoSubmitOnTimeout?: boolean;

  @IsOptional()
  @IsBoolean()
  allowResume?: boolean;

  @IsOptional()
  @IsEnum(ExamResultReleaseMode)
  resultReleaseMode?: ExamResultReleaseMode;

  @IsOptional()
  @IsBoolean()
  showScore?: boolean;

  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean;

  @IsOptional()
  @IsBoolean()
  showExplanations?: boolean;

  @IsOptional()
  @IsBoolean()
  showQuestionReview?: boolean;

  @IsOptional()
  @IsDateString()
  resultPublishAt?: string;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  selectedSlotIds!: number[];

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  sessionCourseIds!: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  resourceFolderId?: number;
}

export class CreateExamImportDto {
  @IsOptional()
  @IsEnum(ExamImportMode)
  importMode?: ExamImportMode;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  examTemplateVersionId!: number;

  @IsEnum(ExamImportScope)
  scope!: ExamImportScope;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examTemplateSlotId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examTemplateSectionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;
}
