import type {
  ApiResponse,
  Course,
  CourseList,
  CourseQuery,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const ENDPOINT = "/courses";

export const coursesApi = {
  create(payload: CreateCourseRequest) {
    return api.post<ApiResponse<Course>>(ENDPOINT, payload).then(unwrapApiData);
  },
  findAll(query?: CourseQuery) {
    return api.get<ApiResponse<CourseList>>(ENDPOINT, { params: query }).then(unwrapApiData);
  },
  findOne(id: number) {
    return api.get<ApiResponse<Course>>(ENDPOINT + "/" + id).then(unwrapApiData);
  },
  update(id: number, payload: UpdateCourseRequest) {
    return api.patch<ApiResponse<Course>>(ENDPOINT + "/" + id, payload).then(unwrapApiData);
  },
  remove(id: number) {
    return api.delete<ApiResponse<Course>>(ENDPOINT + "/" + id).then(unwrapApiData);
  },
};
