import type {
  ApiResponse,
  CreateStudentRequest,
  CurrentStudent,
  Student,
  StudentCourseList,
  StudentCourseFolders,
  StudentCoursesQuery,
  StudentDashboard,
  StudentResourceList,
  StudentResourceDetail,
  StudentDocumentProgress,
  StudentVideoProgress,
  StudentVideoResourceDetail,
  StudentResourcesQuery,
  StudentFolderResourceList,
  StudentFolderResourcesQuery,
  StudentExamResourceDetail,
  StudentExamAttempt,
  StudentExamReport,
  StudentList,
  StudentQuery,
  UpdateStudentRequest,
  UpdateStudentVideoProgressRequest,
  StudentResourceActivityEndReason,
  StudentResourceActivityEventType,
  StudentResourceActivityHeartbeat,
  StudentResourceActivitySession,
  StudentSelfProfile,
  StudentProfilePreferences,
  UpdateMyStudentProfileRequest,
  UpdateMyStudentPreferencesRequest,
  ChangeMyStudentPasswordRequest,
  ChangeMyStudentPasswordResponse,
  StudentCalendarQuery,
  StudentCalendarResponse,
  StudentNotificationsQuery,
  StudentNotificationsResponse,
  StudentUnreadNotificationCount,
  UpdateStudentNotificationRequest,
  UpdateStudentNotificationResponse,
  MarkAllStudentNotificationsReadResponse,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const STUDENTS_ENDPOINT = "/students";
const examAttemptEndpoint = (attemptId: number, attemptUuid: string) =>
  `${STUDENTS_ENDPOINT}/me/exam-attempts/${attemptId}/${attemptUuid}`;

export const studentsApi = {
  create(payload: CreateStudentRequest) {
    return api
      .post<ApiResponse<Student>>(STUDENTS_ENDPOINT, payload)
      .then(unwrapApiData);
  },

  findAll(query?: StudentQuery) {
    return api
      .get<ApiResponse<StudentList>>(STUDENTS_ENDPOINT, {
        params: query,
      })
      .then(unwrapApiData);
  },

  findOne(id: number) {
    return api
      .get<ApiResponse<Student>>(`${STUDENTS_ENDPOINT}/${id}`)
      .then(unwrapApiData);
  },

  findMyDashboard() {
    return api
      .get<ApiResponse<StudentDashboard>>(`${STUDENTS_ENDPOINT}/me/dashboard`)
      .then(unwrapApiData);
  },

  findMyProfile() {
    return api
      .get<ApiResponse<StudentSelfProfile>>(`${STUDENTS_ENDPOINT}/me/profile`)
      .then(unwrapApiData);
  },

  findMyCalendar(query?: StudentCalendarQuery) {
    return api
      .get<ApiResponse<StudentCalendarResponse>>(
        `${STUDENTS_ENDPOINT}/me/calendar`,
        {
          params: query
            ? {
                ...query,
                types: query.types?.join(","),
              }
            : undefined,
        },
      )
      .then(unwrapApiData);
  },

  findMyNotifications(query?: StudentNotificationsQuery) {
    return api
      .get<ApiResponse<StudentNotificationsResponse>>(
        `${STUDENTS_ENDPOINT}/me/notifications`,
        {
          params: query
            ? {
                ...query,
                types: query.types?.join(","),
              }
            : undefined,
        },
      )
      .then(unwrapApiData);
  },

  findMyUnreadNotificationCount() {
    return api
      .get<ApiResponse<StudentUnreadNotificationCount>>(
        `${STUDENTS_ENDPOINT}/me/notifications/unread-count`,
      )
      .then(unwrapApiData);
  },

  updateMyNotification(
    notificationUuid: string,
    payload: UpdateStudentNotificationRequest,
  ) {
    return api
      .patch<ApiResponse<UpdateStudentNotificationResponse>>(
        `${STUDENTS_ENDPOINT}/me/notifications/${notificationUuid}`,
        payload,
      )
      .then(unwrapApiData);
  },

  markAllMyNotificationsRead() {
    return api
      .patch<ApiResponse<MarkAllStudentNotificationsReadResponse>>(
        `${STUDENTS_ENDPOINT}/me/notifications/read-all`,
      )
      .then(unwrapApiData);
  },

  updateMyProfile(payload: UpdateMyStudentProfileRequest) {
    return api
      .patch<ApiResponse<StudentSelfProfile>>(
        `${STUDENTS_ENDPOINT}/me/profile`,
        payload,
      )
      .then(unwrapApiData);
  },

  findMyAvatar() {
    return api
      .get<Blob>(`${STUDENTS_ENDPOINT}/me/profile/avatar`, {
        responseType: "blob",
      })
      .then((response) => response.data);
  },

  uploadMyAvatar(file: File) {
    const payload = new FormData();
    payload.append("file", file);
    return api
      .post<ApiResponse<StudentSelfProfile>>(
        `${STUDENTS_ENDPOINT}/me/profile/avatar`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then(unwrapApiData);
  },

  deleteMyAvatar() {
    return api
      .delete<ApiResponse<StudentSelfProfile>>(
        `${STUDENTS_ENDPOINT}/me/profile/avatar`,
      )
      .then(unwrapApiData);
  },

  updateMyPreferences(payload: UpdateMyStudentPreferencesRequest) {
    return api
      .patch<ApiResponse<StudentProfilePreferences>>(
        `${STUDENTS_ENDPOINT}/me/preferences`,
        payload,
      )
      .then(unwrapApiData);
  },

  changeMyPassword(payload: ChangeMyStudentPasswordRequest) {
    return api
      .patch<ApiResponse<ChangeMyStudentPasswordResponse>>(
        `${STUDENTS_ENDPOINT}/me/password`,
        payload,
      )
      .then(unwrapApiData);
  },

  findMyCourses(query?: StudentCoursesQuery) {
    return api
      .get<ApiResponse<StudentCourseList>>(`${STUDENTS_ENDPOINT}/me/courses`, {
        params: query,
      })
      .then(unwrapApiData);
  },

  findMyResources(query?: StudentResourcesQuery) {
    return api
      .get<ApiResponse<StudentResourceList>>(
        `${STUDENTS_ENDPOINT}/me/resources`,
        {
          params: query,
        },
      )
      .then(unwrapApiData);
  },

  findMyCourseFolders(sessionCourseId: number) {
    return api
      .get<ApiResponse<StudentCourseFolders>>(
        `${STUDENTS_ENDPOINT}/me/courses/${sessionCourseId}/folders`,
      )
      .then(unwrapApiData);
  },

  findMyFolderResources(
    sessionCourseId: number,
    folderId: number,
    query?: StudentFolderResourcesQuery,
  ) {
    return api
      .get<ApiResponse<StudentFolderResourceList>>(
        `${STUDENTS_ENDPOINT}/me/courses/${sessionCourseId}/folders/${folderId}/resources`,
        { params: query },
      )
      .then(unwrapApiData);
  },

  findMyExamResource(resourceId: number) {
    return api
      .get<ApiResponse<StudentExamResourceDetail>>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}/exam`,
      )
      .then(unwrapApiData);
  },

  startMyExam(resourceId: number) {
    return api
      .post<
        ApiResponse<{
          attemptId: number;
          attemptUuid: string;
          resumed: boolean;
        }>
      >(`${STUDENTS_ENDPOINT}/me/resources/${resourceId}/exam/start`)
      .then(unwrapApiData);
  },

  findMyExamAttempt(attemptId: number, attemptUuid: string) {
    return api
      .get<
        ApiResponse<
          | StudentExamAttempt
          | {
              attemptId: number;
              attemptUuid: string;
              status: string;
              submitted: true;
              reportAvailable: boolean;
            }
        >
      >(examAttemptEndpoint(attemptId, attemptUuid))
      .then(unwrapApiData);
  },

  saveMyExamAnswer(
    attemptId: number,
    attemptUuid: string,
    attemptQuestionId: number,
    payload: {
      selectedOptionIds?: number[];
      textAnswer?: string | null;
      numericAnswer?: number | null;
      markedForReview?: boolean;
      timeSpentSeconds?: number;
    },
  ) {
    return api
      .patch<ApiResponse<{ saved: boolean; savedAt: string }>>(
        `${examAttemptEndpoint(attemptId, attemptUuid)}/answers/${attemptQuestionId}`,
        payload,
      )
      .then(unwrapApiData);
  },

  updateMyExamProgress(
    attemptId: number,
    attemptUuid: string,
    payload: { attemptQuestionId: number; timeSpentSeconds?: number },
  ) {
    return api
      .patch<ApiResponse<{ saved: boolean; savedAt: string }>>(
        `${examAttemptEndpoint(attemptId, attemptUuid)}/progress`,
        payload,
      )
      .then(unwrapApiData);
  },

  submitMyExam(attemptId: number, attemptUuid: string) {
    return api
      .post<
        ApiResponse<{
          attemptId: number;
          attemptUuid: string;
          status: string;
          submittedAt: string | null;
          reportAvailable: boolean;
        }>
      >(`${examAttemptEndpoint(attemptId, attemptUuid)}/submit`)
      .then(unwrapApiData);
  },

  continueMyExamAfterTimeout(attemptId: number, attemptUuid: string) {
    return api
      .post<
        ApiResponse<
          | StudentExamAttempt
          | {
              attemptId: number;
              attemptUuid: string;
              status: string;
              submitted: true;
              reportAvailable: boolean;
            }
        >
      >(`${examAttemptEndpoint(attemptId, attemptUuid)}/continue-after-timeout`)
      .then(unwrapApiData);
  },

  findMyExamReport(attemptId: number, attemptUuid: string) {
    return api
      .get<ApiResponse<StudentExamReport>>(
        `${examAttemptEndpoint(attemptId, attemptUuid)}/report`,
      )
      .then(unwrapApiData);
  },

  findMyResource(resourceId: number) {
    return api
      .get<ApiResponse<StudentResourceDetail>>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}`,
      )
      .then(unwrapApiData);
  },

  findMyResourceFile(resourceId: number) {
    return api
      .get<ArrayBuffer>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}/file`,
        {
          responseType: "arraybuffer",
        },
      )
      .then((response) => response.data);
  },

  recordMyResourceAccess(resourceId: number, totalPages?: number) {
    return api
      .post<ApiResponse<StudentDocumentProgress>>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}/access`,
        totalPages ? { totalPages } : {},
      )
      .then(unwrapApiData);
  },

  startMyResourceActivity(
    resourceId: number,
    payload: { startPositionSeconds?: number; clientSessionUuid?: string } = {},
  ) {
    return api
      .post<ApiResponse<StudentResourceActivitySession>>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}/activity`,
        payload,
      )
      .then(unwrapApiData);
  },

  heartbeatMyResourceActivity(
    sessionUuid: string,
    payload: {
      active: boolean;
      currentPositionSeconds?: number;
      pageNumber?: number;
      completed?: boolean;
    },
  ) {
    return api
      .post<ApiResponse<StudentResourceActivityHeartbeat>>(
        `${STUDENTS_ENDPOINT}/me/resource-activity/${sessionUuid}/heartbeat`,
        payload,
      )
      .then(unwrapApiData);
  },

  switchMyDocumentPage(sessionUuid: string, pageNumber: number) {
    return api
      .post<ApiResponse<{ pageNumber: number; enteredAt: string }>>(
        `${STUDENTS_ENDPOINT}/me/resource-activity/${sessionUuid}/pages`,
        { pageNumber },
      )
      .then(unwrapApiData);
  },

  recordMyResourceActivityEvent(
    sessionUuid: string,
    payload: {
      eventType: StudentResourceActivityEventType;
      clientEventId?: string;
      videoPositionSeconds?: number;
      pageNumber?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return api
      .post<ApiResponse<{ eventUuid: string; occurredAt: string }>>(
        `${STUDENTS_ENDPOINT}/me/resource-activity/${sessionUuid}/events`,
        payload,
      )
      .then(unwrapApiData);
  },

  endMyResourceActivity(
    sessionUuid: string,
    payload: {
      reason: StudentResourceActivityEndReason;
      active?: boolean;
      currentPositionSeconds?: number;
      pageNumber?: number;
      completed?: boolean;
    },
  ) {
    return api
      .post<ApiResponse<{ sessionUuid: string; endedAt: string } | null>>(
        `${STUDENTS_ENDPOINT}/me/resource-activity/${sessionUuid}/end`,
        payload,
      )
      .then(unwrapApiData);
  },

  findMyVideoResource(resourceId: number) {
    return api
      .get<ApiResponse<StudentVideoResourceDetail>>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}/video`,
      )
      .then(unwrapApiData);
  },

  updateMyVideoProgress(
    resourceId: number,
    payload: UpdateStudentVideoProgressRequest,
  ) {
    return api
      .patch<ApiResponse<StudentVideoProgress>>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}/video/progress`,
        payload,
      )
      .then(unwrapApiData);
  },

  findMe() {
    return api
      .get<ApiResponse<CurrentStudent>>(`${STUDENTS_ENDPOINT}/me`)
      .then(unwrapApiData);
  },

  update(id: number, payload: UpdateStudentRequest) {
    return api
      .patch<ApiResponse<Student>>(`${STUDENTS_ENDPOINT}/${id}`, payload)
      .then(unwrapApiData);
  },

  remove(id: number) {
    return api
      .delete<ApiResponse<Student>>(`${STUDENTS_ENDPOINT}/${id}`)
      .then(unwrapApiData);
  },
};
