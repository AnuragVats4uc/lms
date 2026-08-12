import type { LucideIcon } from "lucide-react";

export type StudentCourseVariant = "green" | "blue" | "purple" | "orange";

export interface StudentCourseCardData {
  id: string;
  title: string;
  shortCode: string;
  instructor: string;
  completionPercentage: number;
  variant: StudentCourseVariant;
}

export type StudentNotificationType = "assignment" | "announcement" | "event";

export interface StudentNotificationData {
  id: string;
  type: StudentNotificationType;
  title: string;
  description: string;
  timestamp: string;
  isUnread: boolean;
}

export type StudentContentUpdateType = "pdf" | "video" | "notes" | "assignment";

export interface StudentContentUpdateData {
  id: string;
  type: StudentContentUpdateType;
  title: string;
  description: string;
  timestamp: string;
}

export interface StudentDashboardHeroData {
  batchLabel: string;
  greeting: string;
  studentName: string;
  subtitle: string;
}

export interface StudentDashboardViewModel {
  hero: StudentDashboardHeroData;
  courses: StudentCourseCardData[];
  notifications: StudentNotificationData[];
  contentUpdates: StudentContentUpdateData[];
}

export interface StudentIconTone {
  background: string;
  color: string;
  Icon: LucideIcon;
}
