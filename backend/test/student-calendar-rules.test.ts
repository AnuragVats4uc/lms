import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calendarIntervalsOverlap,
  isCalendarExamResourceAssigned,
  normalizeStudentCalendarRange,
  toStudentExamCalendarStatus,
  toStudentSessionCalendarStatus,
} from '../src/modules/students/student-calendar.rules';

test('calendar defaults cover the current month, next month, and one-week buffers', () => {
  const range = normalizeStudentCalendarRange({
    now: new Date('2026-08-29T12:00:00.000Z'),
  });

  assert.equal(range.from.toISOString(), '2026-07-25T00:00:00.000Z');
  assert.equal(range.to.toISOString(), '2026-10-08T00:00:00.000Z');
});

test('calendar rejects reversed and excessively large ranges', () => {
  assert.throws(
    () =>
      normalizeStudentCalendarRange({
        from: '2026-09-01T00:00:00.000Z',
        to: '2026-08-01T00:00:00.000Z',
      }),
    /end must be after its start/,
  );
  assert.throws(
    () =>
      normalizeStudentCalendarRange({
        from: '2026-01-01T00:00:00.000Z',
        to: '2027-01-07T00:00:00.001Z',
      }),
    /cannot exceed 370 days/,
  );
});

test('exam status is derived from both lifecycle state and schedule', () => {
  const exam = {
    status: 'LIVE',
    availableFrom: new Date('2026-08-29T10:00:00.000Z'),
    availableUntil: new Date('2026-08-29T12:00:00.000Z'),
  };

  assert.equal(
    toStudentExamCalendarStatus(exam, new Date('2026-08-29T09:59:59.000Z')),
    'UPCOMING',
  );
  assert.equal(
    toStudentExamCalendarStatus(exam, new Date('2026-08-29T11:00:00.000Z')),
    'AVAILABLE',
  );
  assert.equal(
    toStudentExamCalendarStatus(exam, new Date('2026-08-29T12:00:00.000Z')),
    'CLOSED',
  );
  assert.equal(
    toStudentExamCalendarStatus({ ...exam, status: 'CANCELLED' }),
    'CANCELLED',
  );
});

test('academic-session status respects start, inclusive end, and completion', () => {
  const session = {
    status: 'ACTIVE',
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: new Date('2026-08-31T23:59:59.999Z'),
  };

  assert.equal(
    toStudentSessionCalendarStatus(
      session,
      new Date('2026-07-31T23:59:59.999Z'),
    ),
    'UPCOMING',
  );
  assert.equal(
    toStudentSessionCalendarStatus(session, session.endDate),
    'ACTIVE',
  );
  assert.equal(
    toStudentSessionCalendarStatus({ ...session, status: 'COMPLETED' }),
    'COMPLETED',
  );
});

test('exam resources must be assigned to their exact session course', () => {
  assert.equal(
    isCalendarExamResourceAssigned({
      folderSessionCourseId: 42,
      assignmentSessionCourseIds: [11, 42],
    }),
    true,
  );
  assert.equal(
    isCalendarExamResourceAssigned({
      folderSessionCourseId: 42,
      assignmentSessionCourseIds: [11, 43],
    }),
    false,
  );
});

test('calendar intervals use an exclusive range end and inclusive event end', () => {
  const range = {
    from: new Date('2026-08-01T00:00:00.000Z'),
    to: new Date('2026-09-01T00:00:00.000Z'),
  };

  assert.equal(
    calendarIntervalsOverlap(
      new Date('2026-07-01T00:00:00.000Z'),
      range.from,
      range,
    ),
    true,
  );
  assert.equal(
    calendarIntervalsOverlap(
      range.to,
      new Date('2026-09-02T00:00:00.000Z'),
      range,
    ),
    false,
  );
});
