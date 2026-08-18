import type {
  ApiResponse,
  CreateStudentRequest,
  CurrentStudent,
  Student,
  StudentCourseList,
  StudentCoursesQuery,
  StudentDashboard,
  StudentList,
  StudentQuery,
  UpdateStudentRequest,
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

  findMe() {
    return api
      .get<ApiResponse<CurrentStudent>>(`${STUDENTS_ENDPOINT}/me`)
      .then(unwrapApiData);
  },

  update(id: number, payload: UpdateStudentRequest) {
    return api
      .patch<ApiResponse<Student>>(
        `${STUDENTS_ENDPOINT}/${id}`,
        payload
      )
      .then(unwrapApiData);
  },

  remove(id: number) {
    return api
      .delete<ApiResponse<Student>>(
        `${STUDENTS_ENDPOINT}/${id}`
      )
      .then(unwrapApiData);
  },
};
