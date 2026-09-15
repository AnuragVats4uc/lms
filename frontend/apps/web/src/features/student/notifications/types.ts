import type {
  StudentNotificationCategory,
  StudentNotificationItem,
} from "@repo/types";

export type CategoryFilter = "ALL" | StudentNotificationCategory;

export type NotificationDateGroup = {
  label: string;
  items: StudentNotificationItem[];
};
