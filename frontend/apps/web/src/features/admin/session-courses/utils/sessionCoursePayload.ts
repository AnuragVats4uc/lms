import type {
  CreateSessionCourseRequest,
  SessionCourse,
  UpdateSessionCourseRequest,
} from "@repo/types";
import type { SessionCourseForm } from "../types";

export const toCreateSessionCoursePayload = (
  form: SessionCourseForm,
): CreateSessionCourseRequest => {
  const payload: CreateSessionCourseRequest = {
    courseId: Number(form.courseId),
    sortOrder: Number(form.sortOrder),
    status: form.status,
  };
  if (form.displayName.trim()) payload.displayName = form.displayName.trim();
  if (form.description.trim()) payload.description = form.description.trim();
  return payload;
};
export const toUpdateSessionCoursePayload = (
  form: SessionCourseForm,
): UpdateSessionCourseRequest => ({
  description: form.description.trim() || undefined,
  displayName: form.displayName.trim() || undefined,
  isPublished: form.isPublished,
  sortOrder: Number(form.sortOrder),
  status: form.status,
});
export const toSessionCourseForm = (
  item: SessionCourse,
): SessionCourseForm => ({
  courseId: String(item.courseId),
  description: item.description ?? "",
  displayName: item.displayName ?? "",
  isPublished: item.isPublished,
  sortOrder: String(item.sortOrder),
  status: item.status,
});
