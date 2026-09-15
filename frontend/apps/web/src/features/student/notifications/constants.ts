import {
  StudentNotificationCategory,
  StudentNotificationReadStatus,
} from "@repo/types";
import {
  BookOpenCheck,
  FileText,
  Megaphone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const NOTIFICATIONS_PAGE_SIZE = 10;

export const categoryMeta: Record<
  StudentNotificationCategory,
  { icon: LucideIcon; label: string; description: string }
> = {
  EXAM: {
    icon: BookOpenCheck,
    label: "Exams",
    description: "Schedules, deadlines and results",
  },
  RESOURCE: {
    icon: FileText,
    label: "Resources",
    description: "New course learning material",
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    label: "Announcements",
    description: "Important LMS updates",
  },
  SYSTEM: {
    icon: ShieldCheck,
    label: "System",
    description: "Account and security information",
  },
};

export const readFilters: Array<{
  label: string;
  value: StudentNotificationReadStatus;
}> = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Read", value: "READ" },
];
