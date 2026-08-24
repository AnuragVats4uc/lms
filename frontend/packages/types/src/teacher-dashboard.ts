import type { PaginatedData, PaginationQuery } from "./api";

export interface TeacherDashboardResourceTypeCounts {
  [code: string]: number;
}

export interface TeacherDashboardStatistics {
  assignedCourses: number;
  activeCourses: number;
  enrolledStudents: number;
  courseEnrollments: number;
  folders: number;
  resources: number;
  publishedResources: number;
  resourceTypes: TeacherDashboardResourceTypeCounts;
}

export interface TeacherDashboardCourse {
  sessionCourseId: number;
  courseId: number;
  title: string;
  code: string;
  description: string | null;
  session: {
    id: number;
    name: string;
    code: string | null;
  };
  status: string;
  isPublished: boolean;
  enrolledStudents: number;
  folders: number;
  resources: number;
  publishedResources: number;
  resourceTypes: TeacherDashboardResourceTypeCounts;
}

export interface TeacherDashboardRecentResource {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  resourceType: {
    id: number;
    code: string;
    name: string;
  };
  status: string;
  isPublished: boolean;
  documentUrl: string | null;
  videoUrl: string | null;
  examId: number | null;
  mimeType: string | null;
  fileSize: string | null;
  durationInSeconds: number | null;
  updatedAt: string;
  createdAt: string;
  folder: {
    id: number;
    name: string;
  };
  sessionCourse: {
    id: number;
    title: string;
    courseCode: string;
    session?: {
      id: number;
      name: string;
      code: string | null;
    };
  };
}

export interface TeacherDashboardRecentStudent {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  studentCode: string;
  sessionCourse: {
    id: number;
    title: string;
  };
}

export interface TeacherDashboardData {
  teacher: {
    id: number;
    email: string;
    organizationId: number;
  };
  statistics: TeacherDashboardStatistics;
  courses: TeacherDashboardCourse[];
  recentResources: TeacherDashboardRecentResource[];
  recentStudents: TeacherDashboardRecentStudent[];
}

export interface TeacherCoursesQuery extends PaginationQuery {
  status?: string;
}

export interface TeacherResourcesQuery extends PaginationQuery {
  sessionCourseId?: number;
  resourceTypeId?: number;
  status?: string;
  published?: boolean;
}

export interface TeacherStudentsQuery extends PaginationQuery {
  sessionCourseId?: number;
}

export type TeacherCourseList = PaginatedData<TeacherDashboardCourse>;

export type TeacherResourceList =
  PaginatedData<TeacherDashboardRecentResource>;

export interface TeacherStudentListItem {
  id: number;
  uuid: string;
  status: string;
  isActive: boolean;
  enrolledAt: string;
  student: {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone: string | null;
    studentCode: string;
    status: string;
    gender: string | null;
  };
  enrollment: {
    id: number;
    uuid: string;
    status: string;
  };
  sessionCourse: {
    id: number;
    title: string;
    courseCode: string;
    session: {
      id: number;
      name: string;
      code: string | null;
    };
  };
}

export type TeacherStudentList = PaginatedData<TeacherStudentListItem>;

export interface TeacherResourceTypeOption {
  id: number;
  code: string;
  name: string;
}
