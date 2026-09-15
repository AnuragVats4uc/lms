import type {
  StudentCalendarEvent,
  StudentCalendarEventType,
} from "@repo/types";

export type CalendarView = "month" | "agenda";
export type TypeFilter = "ALL" | StudentCalendarEventType;
export type CourseFilter = number | "ALL";
export type CalendarMarker = {
  event: StudentCalendarEvent;
  kind: "Exam" | "Opens" | "Closes" | "Available";
};
