import {
  BellRing,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Megaphone,
  Play,
} from "lucide-react";
import type {
  ResourceTypeCode,
  StudentDashboardNotificationType,
} from "@repo/types";

import type { StudentCourseVariant, StudentNotificationTone } from "../types";

export const courseVariants: StudentCourseVariant[] = [
  "green",
  "blue",
  "purple",
  "orange",
];

export const notificationIconTones: Record<
  StudentDashboardNotificationType,
  StudentNotificationTone
> = {
  ASSIGNMENT: { background: "#DDF7E9", color: "#0AA66A", Icon: ClipboardList },
  ANNOUNCEMENT: { background: "#FFF3DA", color: "#F59E0B", Icon: Megaphone },
  EVENT: { background: "#E4F1FF", color: "#1683FF", Icon: CalendarDays },
  EXAM: { background: "#EFE7FF", color: "#7C3AED", Icon: FileText },
  RESOURCE: { background: "#E8F8EF", color: "#10B981", Icon: BookOpen },
  SYSTEM: { background: "#EEF2F7", color: "#52627A", Icon: BellRing },
};

export const contentUpdateIconTones: Record<
  ResourceTypeCode,
  StudentNotificationTone
> = {
  DOCUMENT: { background: "#FFE8E8", color: "#EF4444", Icon: FileText },
  VIDEO: { background: "#E8F8EF", color: "#10B981", Icon: Play },
  EXAM: { background: "#E4F1FF", color: "#1683FF", Icon: CalendarDays },
};
