export type StudentNotificationCategory =
  "EXAM" | "RESOURCE" | "ANNOUNCEMENT" | "SYSTEM";

export type StudentNotificationReadStatus = "ALL" | "UNREAD" | "READ";

export interface StudentNotificationsQuery {
  page?: number;
  limit?: number;
  types?: StudentNotificationCategory[];
  status?: StudentNotificationReadStatus;
  search?: string;
}

export interface StudentNotificationItem {
  uuid: string;
  type: StudentNotificationCategory;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  expiresAt: string | null;
  action: {
    label: string;
    href: string;
  } | null;
}

export interface StudentNotificationsResponse {
  items: StudentNotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unread: number;
  };
  summary: {
    unread: number;
    byType: Record<StudentNotificationCategory, number>;
  };
  delivery: {
    inAppEnabled: boolean;
    examRemindersEnabled: boolean;
    resourceUpdatesEnabled: boolean;
    announcementNotificationsEnabled: boolean;
    securityAlertsEnabled: boolean;
  };
}

export interface StudentUnreadNotificationCount {
  unread: number;
}

export interface UpdateStudentNotificationRequest {
  isRead: boolean;
}

export interface UpdateStudentNotificationResponse {
  uuid: string;
  isRead: boolean;
  updatedAt: string;
}

export interface MarkAllStudentNotificationsReadResponse {
  updated: number;
  unread: number;
}
