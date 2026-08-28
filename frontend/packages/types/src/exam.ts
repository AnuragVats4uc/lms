export type ExamQuestionTypeCode = "SINGLE_CHOICE" | "NUMERIC" | "ONE_WORD";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type ExamVirtualKeyboardMode = "NONE" | "NUMERIC" | "ALPHANUMERIC";
export type ExamNavigationMode = "FREE" | "SEQUENTIAL" | "LOCKED_AFTER_SUBMIT";
export type ExamResultReleaseMode = "IMMEDIATE" | "SCHEDULED" | "MANUAL";
export type ExamAttemptStatus =
  "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EVALUATED" | "CANCELLED";
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

export interface ExamTopic {
  id: number;
  uuid: string;
  organizationId: number;
  subjectId: number;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  subject?: ExamSubject;
  _count?: { questionVersions: number };
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
  difficulty: QuestionDifficulty;
  topic: ExamTopic | null;
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
  normalizeWhitespace: boolean;
  virtualKeyboardMode: ExamVirtualKeyboardMode;
  allowPhysicalKeyboard: boolean;
  allowPaste: boolean;
  maxAnswerLength: number | null;
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
  topicId?: number;
  questionTypeId?: number;
  difficulty?: QuestionDifficulty;
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
  instructions: string | null;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  navigationMode: ExamNavigationMode;
  allowReview: boolean;
  autoSubmitOnTimeout: boolean;
  isActive: boolean;
  subjects: ExamTemplateSectionSubject[];
}

export interface ExamTemplateSlot {
  id: number;
  code: string;
  name: string;
  durationMinutes: number;
  description: string | null;
  instructions: string | null;
  navigationMode: ExamNavigationMode;
  autoSubmitOnTimeout: boolean;
  isActive: boolean;
  sections: ExamTemplateSection[];
}

export interface ExamTemplateVersion {
  id: number;
  versionNumber: number;
  status: ExamTemplateVersionStatus;
  defaultDurationMinutes: number | null;
  defaultAttemptLimit: number;
  instructions: string | null;
  enforceSlotTimers: boolean;
  enforceSectionTimers: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  slots: ExamTemplateSlot[];
  _count?: { slots: number; exams: number; importJobs: number };
}

export interface ExamTemplate {
  id: number;
  organizationId?: number;
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
  _summary?: {
    durationMinutes: number | null;
    defaultAttemptLimit: number;
    slotCount: number;
    sectionCount: number;
    questionCount: number;
    latestVersionStatus: ExamTemplateVersionStatus | ExamTemplateStatus;
  };
};

export interface ExamTemplateListParams {
  organizationId?: number;
  search?: string;
  status?: ExamTemplateStatus;
  page?: number;
  limit?: number;
}

export interface ScheduledExam {
  id: number;
  code: string;
  title: string;
  status: ExamStatus;
  availableFrom: string;
  availableUntil: string;
  durationMinutes: number;
  attemptLimit: number;
  passingPercentage: string | null;
  autoSubmitOnTimeout: boolean;
  allowResume: boolean;
  resultReleaseMode: ExamResultReleaseMode;
  resultPublishAt: string | null;
  resultsReleasedAt: string | null;
  showScore: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  showQuestionReview: boolean;
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
  topicId: number | null;
  topicCode: string | null;
  topic: ExamTopic | null;
  questionCode: string | null;
  questionTypeId: number | null;
  rawQuestionTypeId: number | null;
  questionType: ExamQuestionType | null;
  difficulty: QuestionDifficulty;
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
  instructions?: string;
  defaultDurationMinutes?: number;
  defaultAttemptLimit?: number;
  enforceSlotTimers?: boolean;
  enforceSectionTimers?: boolean;
  slots: Array<{
    code?: string;
    name: string;
    description?: string;
    instructions?: string;
    durationMinutes: number;
    navigationMode?: ExamNavigationMode;
    autoSubmitOnTimeout?: boolean;
    sections: Array<{
      code?: string;
      name: string;
      instructions?: string;
      durationMinutes: number;
      questionsToAttempt?: number;
      randomizeQuestions?: boolean;
      randomizeOptions?: boolean;
      navigationMode?: ExamNavigationMode;
      allowReview?: boolean;
      autoSubmitOnTimeout?: boolean;
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

export interface StudentExamAttemptQuestion {
  id: number;
  order: number;
  code: string;
  subject: Pick<ExamSubject, "id" | "code" | "name">;
  sectionAttemptId: number;
  content: string;
  comprehension: { id: number; code: string; content: string } | null;
  questionType: ExamQuestionType;
  difficulty: QuestionDifficulty;
  options: Array<{ id: number; code: string; content: string }>;
  marks: number;
  negativeMarks: number;
  inputPolicy: {
    virtualKeyboardMode: ExamVirtualKeyboardMode;
    allowPhysicalKeyboard: boolean;
    allowPaste: boolean;
    maxAnswerLength: number | null;
  };
  state: {
    visited: boolean;
    markedForReview: boolean;
    answered: boolean;
    selectedOptionIds: number[];
    textAnswer: string;
    numericAnswer: number | null;
  };
}

export interface StudentExamAttempt {
  attemptUuid: string;
  attemptNumber: number;
  attemptLimit: number;
  status: ExamAttemptStatus;
  serverTime: string;
  startedAt: string;
  expiresAt: string;
  lastSavedAt: string | null;
  currentQuestionId: number | null;
  title: string;
  code: string;
  instructions: string | null;
  durationMinutes: number;
  autoSubmitOnTimeout: boolean;
  allowResume: boolean;
  timeoutState: {
    scope: "EXAM" | "SLOT" | "SECTION";
    scopeId: number | null;
    autoSubmitOnTimeout: boolean;
    message: string;
  } | null;
  slots: Array<{
    id: number;
    code: string;
    name: string;
    instructions: string | null;
    navigationMode: ExamNavigationMode;
    autoSubmitOnTimeout: boolean;
    status: ExamAttemptStatus;
    startedAt: string | null;
    expiresAt: string | null;
    submittedAt: string | null;
    sections: Array<{
      id: number;
      code: string;
      name: string;
      instructions: string | null;
      navigationMode: ExamNavigationMode;
      allowReview: boolean;
      autoSubmitOnTimeout: boolean;
      questionsToAttempt: number | null;
      status: ExamAttemptStatus;
      startedAt: string | null;
      expiresAt: string | null;
      submittedAt: string | null;
    }>;
  }>;
  questions: StudentExamAttemptQuestion[];
}

export interface StudentExamReport {
  attemptUuid: string;
  status: ExamAttemptStatus;
  released: boolean;
  message?: string;
  title?: string;
  attemptNumber?: number;
  startedAt?: string;
  submittedAt?: string;
  evaluatedAt?: string | null;
  submissionReason?:
    | "STUDENT_SUBMITTED"
    | "EXAM_TIMEOUT"
    | "SLOT_TIMEOUT"
    | "SECTION_TIMEOUT"
    | "ADMIN_FORCED"
    | null;
  durationSeconds?: number;
  calculationVersion?: number;
  score?: number;
  maximumScore?: number;
  percentage?: number;
  rank?: number | null;
  percentile?: number | null;
  cohortSize?: number;
  rankBasis?:
    | "COURSE_BEST_ATTEMPT_PER_STUDENT"
    | "EXAM_BEST_ATTEMPT_PER_STUDENT"
    | "UNAVAILABLE";
  summary?: {
    total: number;
    answered: number;
    attempted: number;
    unanswered: number;
    unattempted: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    completionRate: number;
  };
  performance?: {
    sections: StudentExamPerformanceMetric[];
    subjects: StudentExamPerformanceMetric[];
    difficulties: Array<
      StudentExamPerformanceMetric & { difficulty: QuestionDifficulty }
    >;
    questionTypes: Array<
      StudentExamPerformanceMetric & {
        questionTypeId: number;
        questionTypeCode: ExamQuestionTypeCode;
      }
    >;
    topics: Array<
      StudentExamPerformanceMetric & {
        topicId: number | null;
        topicCode: string | null;
        subjectId: number;
        subjectName: string;
        classification:
          | "STRONG"
          | "DEVELOPING"
          | "WEAK"
          | "NOT_ATTEMPTED"
          | "LIMITED_DATA";
      }
    >;
  };
  timeAnalysis?: {
    totalSeconds: number;
    trackedQuestionSeconds: number;
    untrackedSeconds: number;
    averageTimePerQuestion: number;
    averageTimePerAttemptedQuestion: number;
    isApproximate: boolean;
    source: "QUESTION_HEARTBEATS";
  };
  result?: {
    status: "PASSED" | "FAILED" | "NOT_CONFIGURED";
    passingPercentage: number | null;
  };
  opportunity?: {
    incorrectQuestionMarks: number;
    unansweredQuestionMarks: number;
    negativeMarksDeducted: number;
    passingScore: number | null;
    marksToPass: number | null;
  };
  trend?: Array<{
    attemptUuid: string;
    attemptNumber: number;
    submittedAt: string;
    exam: { id: number; code: string; title: string };
    score: number;
    maximumScore: number;
    percentage: number;
  }>;
  questions?: Array<{
    id: number;
    order: number;
    code: string;
    subject: { id: number; name: string };
    topic: { id: number; name: string } | null;
    section: { id: number; name: string };
    content: string;
    comprehension: { id: number; code: string; content: string } | null;
    questionType: { id: number; code: ExamQuestionTypeCode; name: string };
    difficulty: QuestionDifficulty;
    explanation?: string | null;
    isCorrect: boolean | null;
    answerState: "CORRECT" | "INCORRECT" | "UNATTEMPTED";
    marksAwarded: number;
    maximumMarks: number;
    negativeMarks: number;
    timeSpentSeconds: number;
    markedForReview: boolean;
    visitedAt: string | null;
    lastViewedAt: string | null;
    studentAnswer: {
      optionIds: number[];
      options: Array<{ id: number; code: string; content: string }>;
      text: string | null;
      numeric: number | null;
    };
    correctAnswer?: {
      optionIds: number[];
      options: Array<{ id: number; code: string; content: string }>;
      acceptedAnswers: string[];
    };
  }>;
}

export interface StudentExamPerformanceMetric {
  key: string;
  label: string;
  marksAwarded: number;
  maximumMarks: number;
  percentage: number;
  timeSpentSeconds: number;
  averageTimePerQuestion: number;
  averageTimePerAttemptedQuestion: number;
  total: number;
  answered: number;
  attempted: number;
  unanswered: number;
  unattempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  completionRate: number;
  sectionId?: number;
  sectionCode?: string;
  subjectId?: number;
  subjectCode?: string;
  difficulty?: QuestionDifficulty;
  questionTypeId?: number;
  questionTypeCode?: ExamQuestionTypeCode;
}

export interface AdminExamReport {
  exam: {
    id: number;
    code: string;
    title: string;
    passingPercentage: number | null;
    session: { id: number; name: string };
    courses: Array<{ id: number; name: string }>;
  };
  basis: "BEST_ATTEMPT_PER_STUDENT";
  summary: {
    totalAttempts: number;
    students: number;
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
    averageAccuracy: number;
    averageCompletionRate: number;
    averageDurationSeconds: number;
    passedStudents: number;
    failedStudents: number;
    passRate: number | null;
  };
  performance: {
    sections: StudentExamPerformanceMetric[];
    difficulties: Array<
      StudentExamPerformanceMetric & { difficulty: QuestionDifficulty }
    >;
    topics: Array<
      StudentExamPerformanceMetric & {
        topicId: number | null;
        topicCode: string | null;
        subjectId: number;
        subjectName: string;
      }
    >;
  };
  students: Array<{
    studentId: number;
    rollNumber: string | null;
    name: string;
    attemptUuid: string;
    attemptNumber: number;
    submittedAt: string | null;
    durationSeconds: number;
    score: number;
    maximumScore: number;
    percentage: number;
    resultStatus: "PASSED" | "FAILED" | "NOT_CONFIGURED";
    rank: number;
    summary: StudentExamReport["summary"];
  }>;
}
