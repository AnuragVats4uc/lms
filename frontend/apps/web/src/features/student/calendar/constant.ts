import type { StudentCalendarEventStatus } from "@repo/types";
import type { TypeFilter } from "./types";

export const weekdayLabels: Array<string> = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const statusLabels: Record<StudentCalendarEventStatus, string> = {
  UPCOMING: "Upcoming",
  AVAILABLE: "Available now",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  ACTIVE: "Active session",
  COMPLETED: "Completed",
};

export const typeFilterOptions: Array<[TypeFilter, string]> = [
  ["ALL", "All"],
  ["EXAM", "Exams"],
  ["ACADEMIC_SESSION", "Sessions"],
];
