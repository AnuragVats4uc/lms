import type {
  ApiResponse,
  CreateStudentRequest,
  CurrentStudent,
  Student,
  StudentCourseList,
  StudentCoursesQuery,
  StudentDashboard,
  StudentResourceList,
  StudentResourceDetail,
  StudentDocumentProgress,
  StudentVideoProgress,
  StudentVideoResourceDetail,
  StudentResourcesQuery,
  StudentList,
  StudentQuery,
  UpdateStudentRequest,
  UpdateStudentVideoProgressRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const STUDENTS_ENDPOINT = "/students";

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

  recordMyResourceAccess(resourceId: number) {
    return api
      .post<ApiResponse<StudentDocumentProgress>>(
        `${STUDENTS_ENDPOINT}/me/resources/${resourceId}/access`,
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
