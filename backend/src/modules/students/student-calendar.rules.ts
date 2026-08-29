export const STUDENT_CALENDAR_MAX_RANGE_DAYS = 370;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StudentCalendarRangeInput {
  from?: string;
  to?: string;
  now?: Date;
}

export function normalizeStudentCalendarRange(
  input: StudentCalendarRangeInput,
) {
  const now = input.now ?? new Date();
  const defaultFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 7 * DAY_MS,
  );
  const defaultTo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1) + 7 * DAY_MS,
  );
  const from = input.from ? new Date(input.from) : defaultFrom;
  const to = input.to ? new Date(input.to) : defaultTo;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error('Calendar range contains an invalid date');
  }
  if (to <= from) {
    throw new Error('Calendar range end must be after its start');
  }
  if (
    to.getTime() - from.getTime() >
    STUDENT_CALENDAR_MAX_RANGE_DAYS * DAY_MS
  ) {
    throw new Error(
      `Calendar range cannot exceed ${STUDENT_CALENDAR_MAX_RANGE_DAYS} days`,
    );
  }

  return { from, to };
}

export function toStudentExamCalendarStatus(
  exam: {
    status: string;
    availableFrom: Date;
    availableUntil: Date;
  },
  now = new Date(),
) {
  if (exam.status === 'CANCELLED') return 'CANCELLED' as const;
  if (exam.status === 'ARCHIVED') return 'ARCHIVED' as const;
  if (exam.status === 'CLOSED' || now >= exam.availableUntil) {
    return 'CLOSED' as const;
  }
  if (now < exam.availableFrom) return 'UPCOMING' as const;
  return 'AVAILABLE' as const;
}

export function toStudentSessionCalendarStatus(
  session: { status: string; startDate: Date; endDate: Date },
  now = new Date(),
) {
  if (session.status === 'ARCHIVED') return 'ARCHIVED' as const;
  if (now < session.startDate) return 'UPCOMING' as const;
  if (now > session.endDate || session.status === 'COMPLETED') {
    return 'COMPLETED' as const;
  }
  return 'ACTIVE' as const;
}

export function isCalendarExamResourceAssigned(input: {
  folderSessionCourseId: number;
  assignmentSessionCourseIds: number[];
}) {
  return input.assignmentSessionCourseIds.includes(input.folderSessionCourseId);
}

export function calendarIntervalsOverlap(
  startsAt: Date,
  endsAt: Date,
  range: { from: Date; to: Date },
) {
  return startsAt < range.to && endsAt >= range.from;
}
