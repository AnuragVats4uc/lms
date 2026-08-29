import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXAM_NOTIFICATION_CONTEXT,
  buildExamReminderNotifications,
  normalizeStudentNotificationsQuery,
  toStudentNotificationAction,
} from '../src/modules/students/student-notification.rules';

test('notification query defaults exclude unsupported student modules', () => {
  const query = normalizeStudentNotificationsQuery({});

  assert.deepEqual(query.types, ['EXAM', 'RESOURCE', 'ANNOUNCEMENT', 'SYSTEM']);
  assert.equal(query.page, 1);
  assert.equal(query.limit, 20);
  assert.equal(query.status, 'ALL');
});

test('upcoming exams generate only reminder offsets that have become due', () => {
  const notifications = buildExamReminderNotifications(
    {
      resourceId: 42,
      title: 'Foundation Mock Test',
      availableFrom: new Date('2026-08-30T12:00:00.000Z'),
      availableUntil: new Date('2026-08-30T14:00:00.000Z'),
      status: 'SCHEDULED',
      attemptLimit: 2,
      attemptsUsed: 0,
    },
    [1440, 60],
    new Date('2026-08-30T10:30:00.000Z'),
  );

  assert.equal(notifications.length, 1);
  assert.equal(
    notifications[0]?.relatedEntity,
    `${EXAM_NOTIFICATION_CONTEXT.REMINDER_PREFIX}1440`,
  );
});

test('available exams generate open and closing notices without duplicates', () => {
  const notifications = buildExamReminderNotifications(
    {
      resourceId: 42,
      title: 'Foundation Mock Test',
      availableFrom: new Date('2026-08-30T10:00:00.000Z'),
      availableUntil: new Date('2026-08-30T11:00:00.000Z'),
      status: 'LIVE',
      attemptLimit: 2,
      attemptsUsed: 1,
    },
    [1440, 60, 60],
    new Date('2026-08-30T10:15:00.000Z'),
  );

  assert.deepEqual(
    notifications.map((item) => item.relatedEntity),
    [EXAM_NOTIFICATION_CONTEXT.AVAILABLE, EXAM_NOTIFICATION_CONTEXT.CLOSING],
  );
});

test('closed, cancelled, and attempt-exhausted exams do not notify', () => {
  const source = {
    resourceId: 42,
    title: 'Foundation Mock Test',
    availableFrom: new Date('2026-08-30T10:00:00.000Z'),
    availableUntil: new Date('2026-08-30T12:00:00.000Z'),
    status: 'LIVE',
    attemptLimit: 1,
    attemptsUsed: 1,
  };

  assert.deepEqual(
    buildExamReminderNotifications(
      source,
      [60],
      new Date('2026-08-30T10:30:00.000Z'),
    ),
    [],
  );
  assert.deepEqual(
    buildExamReminderNotifications(
      { ...source, attemptsUsed: 0, status: 'CANCELLED' },
      [60],
      new Date('2026-08-30T10:30:00.000Z'),
    ),
    [],
  );
});

test('notification actions only use whitelisted local student routes', () => {
  assert.deepEqual(
    toStudentNotificationAction({
      relatedEntity: EXAM_NOTIFICATION_CONTEXT.RESULT,
      relatedEntityId: 42,
    }),
    { label: 'View result', href: '/student/resources/42/exam' },
  );
  assert.equal(
    toStudentNotificationAction({
      relatedEntity: 'https://malicious.example',
      relatedEntityId: 42,
    }),
    null,
  );
});
