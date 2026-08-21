import type {
  ApiResponse,
  ExamImportJob,
  ExamQuestion,
  ExamQuestionListParams,
  ExamQuestionType,
  ExamSubject,
  ExamTemplate,
  ExamTemplateListItem,
  SaveExamTemplateStructureRequest,
  ScheduledExam,
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
      code: string;
      name: string;
      description?: string;
    }) =>
      api
        .post<ApiResponse<ExamSubject>>("/exam-subjects", payload)
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
      code: string;
      questionTypeId: number;
      content: string;
      explanation?: string;
      defaultMarks: number;
      defaultNegativeMarks: number;
      options?: Array<{ code: string; content: string; isCorrect: boolean }>;
      acceptedAnswers?: string[];
      numericTolerance?: number;
      caseSensitive?: boolean;
    }) =>
      api
        .post<ApiResponse<ExamQuestion>>("/exam-questions", payload)
        .then(unwrapApiData),
  },
  templates: {
    list: (organizationId?: number) =>
      api
        .get<ApiResponse<ExamTemplateListItem[]>>("/exam-templates", {
          params: { organizationId },
        })
        .then(unwrapApiData),
    get: (id: number) =>
      api
        .get<ApiResponse<ExamTemplate>>(`/exam-templates/${id}`)
        .then(unwrapApiData),
    create: (payload: {
      organizationId?: number;
      code: string;
      name: string;
      description?: string;
      instructions?: string;
      defaultDurationMinutes?: number;
    }) =>
      api
        .post<ApiResponse<ExamTemplate>>("/exam-templates", payload)
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
    createVersion: (id: number) =>
      api
        .post<ApiResponse<ExamTemplate>>(`/exam-templates/${id}/versions`)
        .then(unwrapApiData),
  },
  scheduled: {
    list: (organizationId?: number) =>
      api
        .get<ApiResponse<ScheduledExam[]>>("/exams", {
          params: { organizationId },
        })
        .then(unwrapApiData),
    create: (payload: Record<string, unknown>) =>
      api
        .post<ApiResponse<ScheduledExam>>("/exams", payload)
        .then(unwrapApiData),
  },
  imports: {
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
  },
};
