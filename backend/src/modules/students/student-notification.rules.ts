import { StudentNotificationType } from '@prisma/client';

import {
  StudentNotificationCategory,
  StudentNotificationReadStatus,
  StudentNotificationsQueryDto,
} from './dto/student-notifications-query.dto';

export const STUDENT_NOTIFICATION_CATEGORIES = [
  StudentNotificationCategory.EXAM,
  StudentNotificationCategory.RESOURCE,
  StudentNotificationCategory.ANNOUNCEMENT,
  StudentNotificationCategory.SYSTEM,
] as const;

export const EXAM_NOTIFICATION_CONTEXT = {
  AVAILABLE: 'EXAM_AVAILABLE_RESOURCE',
  CLOSING: 'EXAM_CLOSING_RESOURCE',
  REMINDER_PREFIX: 'EXAM_REMINDER_',
  RESULT: 'EXAM_RESULT_RESOURCE',
  SCHEDULED: 'EXAM_SCHEDULED_RESOURCE',
} as const;

export interface NormalizedStudentNotificationsQuery {
  page: number;
  limit: number;
  types: StudentNotificationCategory[];
  status: StudentNotificationReadStatus;
  search: string;
}

export interface StudentNotificationAction {
  label: string;
  href: string;
}

export interface StudentNotificationCreateCandidate {
  type: StudentNotificationType;
  title: string;
  description: string;
  relatedEntity: string;
  relatedEntityId: number;
  expiresAt: Date | null;
}

export interface ExamNotificationSource {
  resourceId: number;
  title: string;
  availableFrom: Date;
  availableUntil: Date;
  status: string;
  attemptLimit: number;
  attemptsUsed: number;
}

export function normalizeStudentNotificationsQuery(
  query: StudentNotificationsQueryDto,
): NormalizedStudentNotificationsQuery {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    types: query.types?.length
      ? [...new Set(query.types)]
      : [...STUDENT_NOTIFICATION_CATEGORIES],
    status: query.status ?? StudentNotificationReadStatus.ALL,
    search: query.search?.trim() ?? '',
  };
}

export function toStudentNotificationAction(input: {
  relatedEntity: string | null;
  relatedEntityId: number | null;
}): StudentNotificationAction | null {
  if (!input.relatedEntityId || !input.relatedEntity) return null;

  if (
    input.relatedEntity.startsWith(EXAM_NOTIFICATION_CONTEXT.RESULT) ||
    input.relatedEntity === EXAM_NOTIFICATION_CONTEXT.SCHEDULED ||
    input.relatedEntity === EXAM_NOTIFICATION_CONTEXT.AVAILABLE ||
    input.relatedEntity === EXAM_NOTIFICATION_CONTEXT.CLOSING ||
    input.relatedEntity.startsWith(EXAM_NOTIFICATION_CONTEXT.REMINDER_PREFIX)
  ) {
    return {
      label: input.relatedEntity.startsWith(EXAM_NOTIFICATION_CONTEXT.RESULT)
        ? 'View result'
        : 'View exam',
      href: `/student/resources/${input.relatedEntityId}/exam`,
    };
  }

  if (input.relatedEntity === 'RESOURCE') {
    return {
      label: 'Open resource',
      href: `/student/resources/${input.relatedEntityId}`,
    };
  }

  return null;
}

export function buildExamReminderNotifications(
  exam: ExamNotificationSource,
  reminderOffsetsMinutes: number[],
  now: Date,
): StudentNotificationCreateCandidate[] {
  if (exam.status === 'CANCELLED' || exam.status === 'CLOSED') return [];
  if (exam.attemptsUsed >= exam.attemptLimit) return [];

  const result: StudentNotificationCreateCandidate[] = [];
  const startsInMinutes = Math.ceil(
    (exam.availableFrom.getTime() - now.getTime()) / 60_000,
  );
  const closesInMinutes = Math.ceil(
    (exam.availableUntil.getTime() - now.getTime()) / 60_000,
  );
  const expiresAt = new Date(
    exam.availableUntil.getTime() + 7 * 24 * 60 * 60 * 1000,
  );

  if (startsInMinutes > 0) {
    for (const offset of [...new Set(reminderOffsetsMinutes)].sort(
      (first, second) => second - first,
    )) {
      if (offset <= 0 || startsInMinutes > offset) continue;
      result.push({
        type: StudentNotificationType.EXAM,
        title: `${exam.title} starts soon`,
        description: `Your exam opens in approximately ${formatReminderOffset(startsInMinutes)}. Review the timing and instructions before you begin.`,
        relatedEntity: `${EXAM_NOTIFICATION_CONTEXT.REMINDER_PREFIX}${offset}`,
        relatedEntityId: exam.resourceId,
        expiresAt,
      });
    }
    return result;
  }

  if (closesInMinutes <= 0) return [];

  result.push({
    type: StudentNotificationType.EXAM,
    title: `${exam.title} is available`,
    description:
      'The exam window is open. Start or resume your attempt before it closes.',
    relatedEntity: EXAM_NOTIFICATION_CONTEXT.AVAILABLE,
    relatedEntityId: exam.resourceId,
    expiresAt,
  });

  if (closesInMinutes <= 60) {
    result.push({
      type: StudentNotificationType.EXAM,
      title: `${exam.title} closes soon`,
      description: `The exam window closes in approximately ${formatReminderOffset(closesInMinutes)}. Submit any in-progress attempt before the deadline.`,
      relatedEntity: EXAM_NOTIFICATION_CONTEXT.CLOSING,
      relatedEntityId: exam.resourceId,
      expiresAt,
    });
  }

  return result;
}

export function buildScheduledExamNotification(input: {
  title: string;
  resourceId: number;
  availableUntil: Date;
  live: boolean;
}): StudentNotificationCreateCandidate {
  return {
    type: StudentNotificationType.EXAM,
    title: input.live
      ? `${input.title} is now available`
      : `${input.title} has been scheduled`,
    description: input.live
      ? 'The exam window is open. Review the instructions and begin when you are ready.'
      : 'A new exam has been added to your calendar. Review its timing and instructions before the exam window opens.',
    relatedEntity: EXAM_NOTIFICATION_CONTEXT.SCHEDULED,
    relatedEntityId: input.resourceId,
    expiresAt: new Date(
      input.availableUntil.getTime() + 7 * 24 * 60 * 60 * 1000,
    ),
  };
}

export function buildExamResultNotification(input: {
  title: string;
  resourceId: number;
  attemptId?: number;
}): StudentNotificationCreateCandidate {
  return {
    type: StudentNotificationType.EXAM,
    title: `${input.title} result is available`,
    description:
      'Your result has been released. Open the exam report to review your performance and improvement areas.',
    relatedEntity: input.attemptId
      ? `${EXAM_NOTIFICATION_CONTEXT.RESULT}_${input.attemptId}`
      : EXAM_NOTIFICATION_CONTEXT.RESULT,
    relatedEntityId: input.resourceId,
    expiresAt: null,
  };
}

function formatReminderOffset(minutes: number) {
  if (minutes < 60)
    return `${Math.max(1, minutes)} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}
