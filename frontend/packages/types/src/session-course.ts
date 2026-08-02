import type { PaginatedData } from "./api";
import type { Course } from "./course";

export type SessionCourseStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface SessionCourse {
  id: number;
  uuid: string;
  sessionId: number;
  courseId: number;
  displayName: string | null;
  description: string | null;
  sortOrder: number;
  isPublished: boolean;
  status: SessionCourseStatus;
  isActive: boolean;
  course: Course;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionCourseRequest {
  courseId: number;
  displayName?: string;
  description?: string;
  sortOrder?: number;
  status?: SessionCourseStatus;
}

export interface UpdateSessionCourseRequest {
  displayName?: string;
  description?: string;
  sortOrder?: number;
  isPublished?: boolean;
  status?: SessionCourseStatus;
  isActive?: boolean;
}

export interface SessionCourseQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SessionCourseStatus;
}

export type SessionCourseList = PaginatedData<SessionCourse>;
