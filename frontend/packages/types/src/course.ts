import type { PaginatedData, PaginationQuery } from "./api";

export type CourseStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface Course {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  thumbnail: string | null;
  durationInDays: number | null;
  price: string | null;
  discount: string | null;
  status: CourseStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  name: string;
  description?: string;
  thumbnail?: string;
  durationInDays?: number;
  price?: number;
  discount?: number;
  status?: CourseStatus;
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  isActive?: boolean;
}

export interface CourseQuery extends PaginationQuery {
  status?: CourseStatus;
}

export type CourseList = PaginatedData<Course>;
