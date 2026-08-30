import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ExamAttemptStatus,
  ExamResultReleaseMode,
  ExamSubmissionReason,
} from '@prisma/client';

import { CurrentUser } from '../src/modules/auth/types/current-user.types';
import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { StudentExamService } from '../src/modules/exam/services/student-exam.service';

const user: CurrentUser = {
  userId: 10,
  email: 'student@example.com',
  organizationId: 7,
  roles: ['STUDENT'],
};

void test('a duplicate finalization returns the committed result without grading twice', async () => {
  const submittedAt = new Date('2026-01-01T00:10:00Z');
  const inProgress = {
    id: 21,
    uuid: 'attempt-21',
    studentId: 10,
    status: ExamAttemptStatus.IN_PROGRESS,
    exam: { resultReleaseMode: ExamResultReleaseMode.IMMEDIATE },
  };
  const completed = {
    ...inProgress,
    status: ExamAttemptStatus.EVALUATED,
    submittedAt,
  };
  let gradingWriteCalled = false;
  const client = {
    studentExamAttempt: {
      findFirst: () => Promise.resolve(inProgress),
      findUnique: () => Promise.resolve(completed),
    },
    $transaction: async (
      operation: (tx: {
        studentExamAttempt: {
          updateMany: () => Promise<{ count: number }>;
        };
      }) => Promise<unknown>,
    ) =>
      operation({
        studentExamAttempt: {
          updateMany: () => Promise.resolve({ count: 0 }),
        },
      }),
    studentExamAnswer: {
      update: () => {
        gradingWriteCalled = true;
      },
    },
  };
  const service = new StudentExamService({
    client,
  } as unknown as ExamRepository);
  const finishAttempt = (
    service as unknown as {
      finishAttempt: (
        attemptUuid: string,
        studentId: number,
        reason: ExamSubmissionReason,
        automatic: boolean,
      ) => Promise<{ status: ExamAttemptStatus }>;
    }
  ).finishAttempt.bind(service);

  const result = await finishAttempt(
    inProgress.uuid,
    inProgress.studentId,
    ExamSubmissionReason.STUDENT_SUBMITTED,
    false,
  );

  assert.equal(result.status, ExamAttemptStatus.EVALUATED);
  assert.equal(gradingWriteCalled, false);
});

void test('answer saving stops when submission has already claimed the attempt', async () => {
  const question = {
    id: 31,
    questionOrder: 1,
    studentExamSlotAttemptId: 41,
    studentExamSectionAttemptId: 51,
    examTemplateQuestionId: 61,
    visitedAt: null,
    lastViewedAt: null,
    markedForReview: false,
    slotAttempt: { id: 41, startedAt: new Date(), submittedAt: null },
    sectionAttempt: {
      id: 51,
      startedAt: new Date(),
      submittedAt: null,
      templateSection: {
        allowReview: true,
        questionsToAttempt: null,
        navigationMode: 'FREE',
      },
    },
    templateQuestion: {
      id: 61,
      questionVersion: {
        maxAnswerLength: null,
        questionType: { code: 'SINGLE_CHOICE' },
        options: [{ id: 71 }],
      },
    },
  };
  const attempt = {
    id: 21,
    uuid: 'attempt-21',
    status: ExamAttemptStatus.IN_PROGRESS,
    expiresAt: new Date(Date.now() + 60_000),
    questions: [question],
    answers: [],
    slotProgress: [
      {
        id: 41,
        selectedSlot: { templateSlot: { navigationMode: 'FREE' } },
      },
    ],
  };
  let answerWriteCalled = false;
  const client = {
    $transaction: async (
      operation: (tx: {
        studentExamAttempt: {
          updateMany: () => Promise<{ count: number }>;
        };
        studentExamAnswer: { upsert: () => void };
      }) => Promise<unknown>,
    ) =>
      operation({
        studentExamAttempt: {
          updateMany: () => Promise.resolve({ count: 0 }),
        },
        studentExamAnswer: {
          upsert: () => {
            answerWriteCalled = true;
          },
        },
      }),
  };
  const service = new StudentExamService({
    client,
  } as unknown as ExamRepository);
  const internals = service as unknown as {
    findOwnedAttempt: () => Promise<{
      student: { id: number };
      attempt: unknown;
    }>;
    synchronizeExpiredScopes: () => Promise<{
      attempt: unknown;
      pendingTimeout: null;
    }>;
    activateQuestionScope: () => Promise<void>;
  };
  internals.findOwnedAttempt = () =>
    Promise.resolve({ student: { id: 10 }, attempt });
  internals.synchronizeExpiredScopes = () =>
    Promise.resolve({ attempt, pendingTimeout: null });
  internals.activateQuestionScope = () => Promise.resolve();

  await assert.rejects(
    service.saveAnswer(user, attempt.id, attempt.uuid, question.id, {
      selectedOptionIds: [71],
    }),
    /no longer active/,
  );
  assert.equal(answerWriteCalled, false);
});
