export type StudentCalendarEventType = "EXAM" | "ACADEMIC_SESSION";

export interface StudentCalendarQuery {
  from?: string;
  to?: string;
  types?: StudentCalendarEventType[];
  courseId?: number;
  search?: string;
}

export type StudentCalendarEventStatus =
  "UPCOMING" | "AVAILABLE" | "CLOSED" | "CANCELLED" | "ACTIVE" | "COMPLETED";

export interface StudentCalendarCourse {
  id: number;
  uuid: string;
  sessionCourseId: number;
  name: string;
  code: string;
}

export interface StudentCalendarEvent {
  id: string;
  type: StudentCalendarEventType;
  source: "EXAM_SCHEDULE" | "ACADEMIC_SESSION";
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  endInclusive: boolean;
  status: StudentCalendarEventStatus;
  displayMode: "STANDARD" | "BACKGROUND";
  href: string | null;
  resource: {
    id: number;
    uuid: string;
    title: string;
  } | null;
  session: {
    id: number;
    uuid: string;
    name: string;
    code: string | null;
  };
  courses: StudentCalendarCourse[];
  exam: {
    id: number;
    uuid: string;
    code: string;
    durationMinutes: number;
    attemptLimit: number;
    attemptsUsed: number;
    allowResume: boolean;
    activeAttemptUuid: string | null;
    latestAttemptUuid: string | null;
  } | null;
}

export interface StudentCalendarResponse {
  timezone: string;
  generatedAt: string;
  range: {
    from: string;
    to: string;
    maxDays: number;
  };
  appliedFilters: {
    types: StudentCalendarEventType[];
    courseId: number | null;
    search: string;
  };
  availableCourses: StudentCalendarCourse[];
  summary: {
    total: number;
    exams: number;
    academicSessions: number;
    upcoming: number;
    availableExams: number;
    closingWithinSevenDays: number;
  };
  events: StudentCalendarEvent[];
}
