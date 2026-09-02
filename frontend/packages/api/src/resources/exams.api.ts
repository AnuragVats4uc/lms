import type {
  ApiResponse,
  ExamImportJob,
  ExamImportStatus,
  ExamQuestion,
  ExamQuestionListParams,
  ExamQuestionType,
  ExamSubject,
  ExamTopic,
  ExamTemplate,
  ExamTemplateListParams,
  ExamTemplateListItem,
  ExamWiseQuestions,
  AdminExamReport,
  SaveExamTemplateStructureRequest,
  ScheduledExam,
  QuestionDifficulty,
} from "@repo/types";
import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

export const examsApi = {
  questionTypes: {
    list: () =>
      api
        .get<ApiResponse<ExamQuestionType[]>>("/exam-question-types")
        .then(unwrapApiData),
  },
  subjects: {
    list: (organizationId?: number) =>
      api
        .get<ApiResponse<ExamSubject[]>>("/exam-subjects", {
          params: { organizationId },
        })
        .then(unwrapApiData),
    create: (payload: {
      organizationId?: number;
      name: string;
      description?: string;
    }) =>
      api
        .post<ApiResponse<ExamSubject>>("/exam-subjects", payload)
        .then(unwrapApiData),
  },
  topics: {
    list: (
      params: {
        organizationId?: number;
        subjectId?: number;
        includeInactive?: boolean;
      } = {},
    ) =>
      api
        .get<ApiResponse<ExamTopic[]>>("/exam-topics", { params })
        .then(unwrapApiData),
    create: (payload: {
      organizationId?: number;
      subjectId: number;
      name: string;
      description?: string;
      sortOrder?: number;
    }) =>
      api
        .post<ApiResponse<ExamTopic>>("/exam-topics", payload)
        .then(unwrapApiData),
    update: (
      id: number,
      payload: {
        name?: string;
        description?: string;
        sortOrder?: number;
        isActive?: boolean;
      },
    ) =>
      api
        .patch<ApiResponse<ExamTopic>>(`/exam-topics/${id}`, payload)
        .then(unwrapApiData),
  },
  questions: {
    list: (params: ExamQuestionListParams = {}) =>
      api
        .get<ApiResponse<ExamQuestion[]>>("/exam-questions", {
          params,
        })
        .then(unwrapApiData),
    create: (payload: {
      organizationId?: number;
      subjectId: number;
      topicId?: number;
      questionTypeId: number;
      difficulty?: QuestionDifficulty;
      content: string;
      explanation?: string;
      defaultMarks: number;
      defaultNegativeMarks: number;
      options?: Array<{ code: string; content: string; isCorrect: boolean }>;
      acceptedAnswers?: string[];
      numericTolerance?: number;
      caseSensitive?: boolean;
      normalizeWhitespace?: boolean;
      virtualKeyboardMode?: "NONE" | "NUMERIC" | "ALPHANUMERIC";
      allowPhysicalKeyboard?: boolean;
      allowPaste?: boolean;
      maxAnswerLength?: number;
    }) =>
      api
        .post<ApiResponse<ExamQuestion>>("/exam-questions", payload)
        .then(unwrapApiData),
  },
  templates: {
    list: (params?: number | ExamTemplateListParams) =>
      api
        .get<ApiResponse<ExamTemplateListItem[]>>("/exam-templates", {
          params:
            typeof params === "number" ? { organizationId: params } : params,
        })
        .then(unwrapApiData),
    get: (id: number) =>
      api
        .get<ApiResponse<ExamTemplate>>(`/exam-templates/${id}`)
        .then(unwrapApiData),
    create: (payload: {
      organizationId?: number;
      name: string;
      description?: string;
      instructions?: string;
      defaultDurationMinutes?: number;
      defaultAttemptLimit?: number;
      enforceSlotTimers?: boolean;
      enforceSectionTimers?: boolean;
    }) =>
      api
        .post<ApiResponse<ExamTemplate>>("/exam-templates", payload)
        .then(unwrapApiData),
    update: (
      id: number,
      payload: {
        name?: string;
        description?: string;
      },
    ) =>
      api
        .patch<ApiResponse<ExamTemplate>>(`/exam-templates/${id}`, payload)
        .then(unwrapApiData),
    saveStructure: (id: number, payload: SaveExamTemplateStructureRequest) =>
      api
        .patch<ApiResponse<ExamTemplate>>(
          `/exam-templates/${id}/structure`,
          payload,
        )
        .then(unwrapApiData),
    publish: (id: number) =>
      api
        .post<ApiResponse<ExamTemplate>>(`/exam-templates/${id}/publish`)
        .then(unwrapApiData),
    createVersion: (id: number, payload?: { copyQuestions?: boolean }) =>
      api
        .post<ApiResponse<ExamTemplate>>(
          `/exam-templates/${id}/versions`,
          payload ?? {},
        )
        .then(unwrapApiData),
    reorderSlots: (id: number, versionId: number, orderedIds: number[]) =>
      api
        .patch<ApiResponse<ExamTemplate>>(
          `/exam-templates/${id}/versions/${versionId}/slots/order`,
          { orderedIds },
        )
        .then(unwrapApiData),
    reorderSections: (
      id: number,
      versionId: number,
      slotId: number,
      orderedIds: number[],
    ) =>
      api
        .patch<ApiResponse<ExamTemplate>>(
          `/exam-templates/${id}/versions/${versionId}/slots/${slotId}/sections/order`,
          { orderedIds },
        )
        .then(unwrapApiData),
  },
  scheduled: {
    list: (organizationId?: number) =>
      api
        .get<ApiResponse<ScheduledExam[]>>("/exams", {
          params: { organizationId },
        })
        .then(unwrapApiData),
    report: (id: number) =>
      api
        .get<ApiResponse<AdminExamReport>>(`/exams/${id}/report`)
        .then(unwrapApiData),
    questions: (id: number) =>
      api
        .get<ApiResponse<ExamWiseQuestions>>(`/exams/${id}/questions`)
        .then(unwrapApiData),
    create: (payload: Record<string, unknown>) =>
      api
        .post<ApiResponse<ScheduledExam>>("/exams", payload)
        .then(unwrapApiData),
    releaseResults: (id: number) =>
      api
        .post<ApiResponse<ScheduledExam>>(`/exams/${id}/release-results`)
        .then(unwrapApiData),
  },
  imports: {
    list: (
      params: {
        organizationId?: number;
        examTemplateVersionId?: number;
        status?: ExamImportStatus;
        limit?: number;
      } = {},
    ) =>
      api
        .get<ApiResponse<ExamImportJob[]>>("/exam-imports", { params })
        .then(unwrapApiData),
    stage: (payload: FormData) =>
      api
        .post<ApiResponse<ExamImportJob>>("/exam-imports", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(unwrapApiData),
    get: (id: number) =>
      api
        .get<ApiResponse<ExamImportJob>>(`/exam-imports/${id}`)
        .then(unwrapApiData),
    commit: (id: number) =>
      api
        .post<ApiResponse<ExamImportJob>>(`/exam-imports/${id}/commit`)
        .then(unwrapApiData),
    downloadTemplate: () =>
      api
        .get<Blob>("/exam-imports/template.xlsx", { responseType: "blob" })
        .then((response) => response.data),
    downloadWordTemplate: () =>
      api
        .get<Blob>("/exam-imports/template.docx", { responseType: "blob" })
        .then((response) => response.data),
    downloadCodelessWordTemplate: () =>
      api
        .get<Blob>("/exam-imports/template-codeless.docx", {
          responseType: "blob",
        })
        .then((response) => response.data),
    downloadCodelessExcelTemplate: () =>
      api
        .get<Blob>("/exam-imports/template-codeless.xlsx", {
          responseType: "blob",
        })
        .then((response) => response.data),
    downloadContextualCodelessExcelTemplate: (versionId: number) =>
      api
        .get<Blob>(`/exam-imports/template-codeless/${versionId}`, {
          responseType: "blob",
        })
        .then((response) => response.data),
  },
};
