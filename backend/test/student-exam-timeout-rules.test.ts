import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExamAttemptStatus, ExamResultReleaseMode } from '@prisma/client';

import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { StudentExamService } from '../src/modules/exam/services/student-exam.service';

function serviceWithTimeoutDetector() {
  const service = new StudentExamService({
    client: {},
  } as unknown as ExamRepository);
  return service as unknown as {
    detectAttemptTimeout: (
      attempt: unknown,
      now: Date,
    ) => {
      scope: 'EXAM' | 'SLOT' | 'SECTION';
      autoSubmitOnTimeout: boolean;
    } | null;
  };
}

function attempt() {
  return {
    status: ExamAttemptStatus.IN_PROGRESS,
    expiresAt: new Date('2026-01-01T01:00:00Z'),
    exam: {
      autoSubmitOnTimeout: false,
      resultReleaseMode: ExamResultReleaseMode.IMMEDIATE,
    },
    slotProgress: [
      {
        id: 1,
        status: ExamAttemptStatus.IN_PROGRESS,
        expiresAt: new Date('2026-01-01T00:20:00Z'),
        selectedSlot: {
          templateSlot: {
            name: 'Slot 1',
            autoSubmitOnTimeout: true,
          },
        },
        sectionProgress: [
          {
            id: 2,
            status: ExamAttemptStatus.IN_PROGRESS,
            expiresAt: new Date('2026-01-01T00:10:00Z'),
            templateSection: {
              name: 'Section 1',
              autoSubmitOnTimeout: false,
            },
          },
        ],
      },
    ],
  };
}

void test('exam timeout has priority and preserves its auto-submit policy', () => {
  const timeout = serviceWithTimeoutDetector().detectAttemptTimeout(
    attempt(),
    new Date('2026-01-01T01:00:01Z'),
  );
  assert.equal(timeout?.scope, 'EXAM');
  assert.equal(timeout?.autoSubmitOnTimeout, false);
});

void test('slot timeout closes the slot before an expired nested section', () => {
  const timeout = serviceWithTimeoutDetector().detectAttemptTimeout(
    attempt(),
    new Date('2026-01-01T00:20:01Z'),
  );
  assert.equal(timeout?.scope, 'SLOT');
  assert.equal(timeout?.autoSubmitOnTimeout, true);
});

void test('section timeout exposes manual continuation when auto-submit is off', () => {
  const timeout = serviceWithTimeoutDetector().detectAttemptTimeout(
    attempt(),
    new Date('2026-01-01T00:10:01Z'),
  );
  assert.equal(timeout?.scope, 'SECTION');
  assert.equal(timeout?.autoSubmitOnTimeout, false);
});
