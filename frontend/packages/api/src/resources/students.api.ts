import type {
  ApiResponse,
  CreateStudentRequest,
  Student,
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
