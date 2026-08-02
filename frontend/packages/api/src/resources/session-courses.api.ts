import type {
  ApiResponse,
  CreateSessionCourseRequest,
  SessionCourse,
  SessionCourseList,
  SessionCourseQuery,
  UpdateSessionCourseRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

function endpoint(sessionId: number) {
  return "/sessions/" + sessionId + "/courses";
}

export const sessionCoursesApi = {
  create(sessionId: number, payload: CreateSessionCourseRequest) {
    return api.post<ApiResponse<SessionCourse>>(endpoint(sessionId), payload).then(unwrapApiData);
  },
  findAll(sessionId: number, query?: SessionCourseQuery) {
    return api.get<ApiResponse<SessionCourseList>>(endpoint(sessionId), { params: query }).then(unwrapApiData);
  },
  findOne(sessionId: number, id: number) {
    return api.get<ApiResponse<SessionCourse>>(endpoint(sessionId) + "/" + id).then(unwrapApiData);
  },
  update(sessionId: number, id: number, payload: UpdateSessionCourseRequest) {
    return api.patch<ApiResponse<SessionCourse>>(endpoint(sessionId) + "/" + id, payload).then(unwrapApiData);
  },
  remove(sessionId: number, id: number) {
    return api.delete<ApiResponse<SessionCourse>>(endpoint(sessionId) + "/" + id).then(unwrapApiData);
  },
};
