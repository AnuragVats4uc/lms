import { sessionCoursesApi } from "@repo/api";
import type {
  CreateSessionCourseRequest,
  SessionCourseStatus,
  UpdateSessionCourseRequest,
} from "@repo/types";

const requireSession = (sessionId: number | null) =>
  sessionId === null
    ? Promise.reject(new Error("Select a session first."))
    : null;

export const useSessionCourseOperations = (sessionId: number | null) => ({
  create: (payload: CreateSessionCourseRequest) =>
    requireSession(sessionId) ??
    sessionCoursesApi.create(sessionId as number, payload),
  findAll: (query: {
    limit: number;
    page: number;
    search?: string;
    status?: string;
  }) =>
    requireSession(sessionId) ??
    sessionCoursesApi.findAll(sessionId as number, {
      ...query,
      status: query.status as SessionCourseStatus | undefined,
    }),
  remove: (id: number) =>
    requireSession(sessionId) ??
    sessionCoursesApi.remove(sessionId as number, id),
  setActive: (id: number, active: boolean) =>
    requireSession(sessionId) ??
    sessionCoursesApi.update(sessionId as number, id, { isActive: active }),
  update: (id: number, payload: UpdateSessionCourseRequest) =>
    requireSession(sessionId) ??
    sessionCoursesApi.update(sessionId as number, id, payload),
});
