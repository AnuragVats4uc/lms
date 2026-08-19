import type { ResourceType, ResourceTypeId } from "./resource";

export type StudentDashboardNotificationType =
  | "ASSIGNMENT"
  | "ANNOUNCEMENT"
  | "EVENT"
  | "EXAM"
  | "RESOURCE"
  | "SYSTEM";

export interface StudentDashboardOrganization {
  id: number;
  name: string;
  code: string;
}

export interface StudentDashboardSession {
  id: number;
  name: string;
  code: string | null;
}

export interface StudentDashboardStudent {
  id: number;
  name: string;
  firstName: string;
  lastName: string | null;
  email: string;
  avatar: string | null;
  batch: string | null;
  organization: StudentDashboardOrganization | null;
  session: StudentDashboardSession | null;
}

export interface StudentDashboardCourse {
  id: number;
  sessionCourseId: number;
  courseId: number;
  title: string;
  shortCode: string;
  instructor: string;
  completionPercentage: number;
  status: string;
  image: string | null;
  continuePath: string;
}

export interface StudentDashboardNotification {
  id: number;
  type: StudentDashboardNotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

export interface StudentDashboardContentUpdate {
  id: number;
  resourceId: number;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
  title: string;
  description: string;
  timestamp: string;
  path: string;
}

export interface StudentDashboardContinueLearning {
  sessionCourseId: number | null;
  resourceId: number | null;
  path: string;
}

export interface StudentDashboard {
  student: StudentDashboardStudent;
  courses: StudentDashboardCourse[];
  notifications: StudentDashboardNotification[];
  contentUpdates: StudentDashboardContentUpdate[];
  continueLearning: StudentDashboardContinueLearning;
}
