import assert from 'node:assert/strict';
import { test } from 'node:test';

import { studentExamNavigationError } from '../src/modules/exam/rules/student-exam-navigation.rules';

function question(
  id: number,
  order: number,
  options: {
    slotMode?: string;
    sectionMode?: string;
    visitedAt?: Date | null;
    slotAttemptId?: number;
    sectionAttemptId?: number;
  } = {},
) {
  return {
    id,
    order,
    slotAttemptId: options.slotAttemptId ?? 1,
    sectionAttemptId: options.sectionAttemptId ?? 1,
    slotNavigationMode: options.slotMode ?? 'FREE',
    sectionNavigationMode: options.sectionMode ?? 'FREE',
    visitedAt: options.visitedAt ?? null,
    lastViewedAt: options.visitedAt ?? null,
  };
}

void test('allows unrestricted movement in free-navigation scopes', () => {
  const questions = [
    question(1, 1, { visitedAt: new Date('2026-01-01T00:00:00Z') }),
    question(2, 2),
    question(3, 3),
  ];
  assert.equal(studentExamNavigationError(questions, 3), null);
});

void test('sequential sections reject skipped and previous questions', () => {
  const questions = [
    question(1, 1, {
      sectionMode: 'SEQUENTIAL',
      visitedAt: new Date('2026-01-01T00:00:00Z'),
    }),
    question(2, 2, {
      sectionMode: 'SEQUENTIAL',
      visitedAt: new Date('2026-01-01T00:01:00Z'),
    }),
    question(3, 3, { sectionMode: 'SEQUENTIAL' }),
    question(4, 4, { sectionMode: 'SEQUENTIAL' }),
  ];
  assert.equal(studentExamNavigationError(questions, 3), null);
  assert.equal(
    studentExamNavigationError(questions, 1),
    'This section requires sequential question navigation',
  );
  assert.equal(
    studentExamNavigationError(questions, 4),
    'This section requires sequential question navigation',
  );
});

void test('sequential slots apply across section boundaries', () => {
  const questions = [
    question(1, 1, {
      slotMode: 'SEQUENTIAL',
      visitedAt: new Date('2026-01-01T00:00:00Z'),
    }),
    question(2, 2, {
      slotMode: 'SEQUENTIAL',
      sectionAttemptId: 2,
    }),
    question(3, 3, {
      slotMode: 'SEQUENTIAL',
      sectionAttemptId: 2,
    }),
  ];
  assert.equal(studentExamNavigationError(questions, 2), null);
  assert.equal(
    studentExamNavigationError(questions, 3),
    'This slot requires sequential question navigation',
  );
});
