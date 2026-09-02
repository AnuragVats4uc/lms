import type { PaginatedData, PaginationQuery } from "./api";
import type { ResourceType, ResourceTypeId } from "./resource";

export type StudentCourseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface StudentCourseResourceCounts {
  videos: number;
  documents: number;
  exams: number;
}

export interface StudentCourseLastAccessed {
  resourceId: number;
  title: string;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  timestamp: string;
  path: string;
}

export interface StudentCourseItem {
  id: number;
  enrollmentId: number;
  sessionCourseId: number;
  courseId: number;
  title: string;
  shortCode: string;
  program: string;
  description: string | null;
  instructor: string;
  completionPercentage: number;
  status: StudentCourseStatus;
  image: string | null;
  resourceCounts: StudentCourseResourceCounts;
  lastAccessed: StudentCourseLastAccessed | null;
  continuePath: string;
  actionLabel: string;
}

export interface StudentCoursesQuery extends PaginationQuery {
  category?: string;
}

export interface StudentCourseList extends PaginatedData<StudentCourseItem> {
  categories: string[];
}

export interface StudentCourseFolderCounts {
  total: number;
  videos: number;
  documents: number;
  exams: number;
}

export interface StudentCourseFolder {
  id: number;
  parentFolderId: number | null;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  childrenCount: number;
  resourceCounts: StudentCourseFolderCounts;
}

export interface StudentCourseContext {
  id: number;
  courseId: number;
  name: string;
  code: string;
  description: string | null;
  sessionId: number;
  sessionName: string;
}

export interface StudentCourseFolders {
  course: StudentCourseContext;
  folders: StudentCourseFolder[];
}
