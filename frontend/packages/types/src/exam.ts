export type ExamQuestionTypeCode = "SINGLE_CHOICE" | "NUMERIC" | "ONE_WORD";
export interface ExamQuestionType {
  id: number;
  code: ExamQuestionTypeCode;
  name: string;
  description: string | null;
  isActive: boolean;
}
export type ExamTemplateStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ExamTemplateVersionStatus = "DRAFT" | "PUBLISHED" | "RETIRED";
export type ExamStatus =
  "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED" | "CANCELLED" | "ARCHIVED";
export type ExamImportScope = "SINGLE_SECTION" | "FULL_EXAM";
export type ExamImportStatus =
  | "UPLOADED"
  | "PARSING"
  | "VALIDATION_FAILED"
  | "READY_FOR_REVIEW"
  | "IMPORTING"
  | "IMPORTED"
  | "FAILED"
  | "CANCELLED";

export interface ExamSubject {
  id: number;
  uuid: string;
  organizationId: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ExamQuestionOption {
  id?: number;
  code: string;
  content: string;
  isCorrect: boolean;
}

export interface ExamQuestionVersion {
  id: number;
  versionNumber: number;
  questionTypeId: number;
  questionType: ExamQuestionType;
  comprehension: {
    id: number;
    code: string;
    content: string;
  } | null;
  content: string;
  explanation: string | null;
  defaultMarks: string;
  defaultNegativeMarks: string;
  caseSensitive: boolean;
  options: ExamQuestionOption[];
  acceptedAnswers: Array<{
    id: number;
    textValue: string | null;
    numericValue: string | null;
    numericTolerance: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

export interface ExamQuestion {
  id: number;
  code: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isActive: boolean;
  subject: ExamSubject;
  versions: ExamQuestionVersion[];
}

export type ExamQuestionSort =
  "LATEST" | "OLDEST" | "CODE" | "RECENTLY_UPDATED";

export interface ExamQuestionListParams {
  organizationId?: number;
  search?: string;
  subjectId?: number;
  questionTypeId?: number;
  status?: ExamQuestion["status"];
  sort?: ExamQuestionSort;
  limit?: number;
}

export interface ExamTemplateQuestion {
  id: number;
  questionVersionId: number;
  marks: string;
  negativeMarks: string;
  questionVersion: ExamQuestionVersion & {
    question: Pick<ExamQuestion, "id" | "code">;
  };
}

export interface ExamTemplateSectionSubject {
  id: number;
  subjectId: number;
  subject: ExamSubject;
  questions: ExamTemplateQuestion[];
}

export interface ExamTemplateSection {
  id: number;
  code: string;
  name: string;
  durationMinutes: number;
  questionsToAttempt: number | null;
  subjects: ExamTemplateSectionSubject[];
}

export interface ExamTemplateSlot {
  id: number;
  code: string;
  name: string;
  durationMinutes: number;
  sections: ExamTemplateSection[];
}

export interface ExamTemplateVersion {
  id: number;
  versionNumber: number;
  status: ExamTemplateVersionStatus;
  defaultDurationMinutes: number | null;
  publishedAt?: string | null;
  createdAt?: string;
  slots: ExamTemplateSlot[];
  _count?: { slots: number; exams: number; importJobs: number };
}

export interface ExamTemplate {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: ExamTemplateStatus;
  isActive: boolean;
  versions: ExamTemplateVersion[];
}

export type ExamTemplateListItem = Omit<ExamTemplate, "versions"> & {
  _count?: { versions: number };
  versions: Array<Omit<ExamTemplateVersion, "slots">>;
};

export interface ScheduledExam {
  id: number;
  code: string;
  title: string;
  status: ExamStatus;
  availableFrom: string;
  availableUntil: string;
  durationMinutes: number;
  attemptLimit: number;
  session: { id: number; name: string };
  templateVersion: {
    id: number;
    versionNumber: number;
    examTemplate: Pick<ExamTemplate, "id" | "name">;
  };
  selectedSlots: Array<{
    id: number;
    templateSlot: Pick<ExamTemplateSlot, "id" | "name">;
  }>;
  courseAssignments: Array<{
    sessionCourse: { id: number; course: { id: number; name: string } };
  }>;
}

export interface ExamImportRow {
  id: number;
  sourceIndex: number;
  slotCode: string | null;
  sectionCode: string | null;
  subjectCode: string | null;
  questionCode: string | null;
  questionTypeId: number | null;
  rawQuestionTypeId: number | null;
  questionType: ExamQuestionType | null;
  comprehensionCode: string | null;
  comprehensionText: string | null;
  questionText: string | null;
  marks: string | null;
  negativeMarks: string | null;
  sortOrder: number | null;
  isMandatory: boolean;
  correctAnswer: string | null;
  numericTolerance: string | null;
  caseSensitive: boolean;
  explanation: string | null;
  optionsJson: Array<{
    code: string;
    content: string;
    isCorrect: boolean;
  }> | null;
  acceptedAnswersJson: string[] | null;
  status: "VALID" | "WARNING" | "ERROR" | "IMPORTED" | "SKIPPED";
  validationMessage: string | null;
}

export interface ExamImportJob {
  id: number;
  files: Array<{
    id: number;
    kind: "CONTENT_DOCX" | "MAPPING_XLSX";
    originalFileName: string;
  }>;
  scope: ExamImportScope;
  status: ExamImportStatus;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  rows: ExamImportRow[];
}

export interface SaveExamTemplateStructureRequest {
  slots: Array<{
    code: string;
    name: string;
    durationMinutes: number;
    sections: Array<{
      code: string;
      name: string;
      durationMinutes: number;
      questionsToAttempt?: number;
      subjects: [
        {
          subjectId: number;
          questions: Array<{
            questionVersionId: number;
            marks: number;
            negativeMarks: number;
          }>;
        },
      ];
    }>;
  }>;
}
