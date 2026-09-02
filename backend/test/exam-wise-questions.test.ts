import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

const scheduledExam = {
  id: 91,
  organizationId: 7,
  code: 'EXAM-91',
  title: 'Immutable Version Exam',
  status: 'SCHEDULED',
  isActive: true,
  availableFrom: new Date('2026-09-01T04:00:00.000Z'),
  availableUntil: new Date('2026-09-01T06:00:00.000Z'),
  durationMinutes: 90,
  session: { id: 4, name: '2026-2027' },
  templateVersion: {
    id: 52,
    versionNumber: 2,
    examTemplate: { id: 41, name: 'Railway Mock' },
  },
  selectedSlots: [
    {
      id: 101,
      sortOrder: 0,
      templateSlot: {
        id: 61,
        code: 'SLOT-1',
        name: 'Slot 1',
        durationMinutes: 90,
        sections: [
          {
            id: 71,
            code: 'GENERAL',
            name: 'General Awareness',
            durationMinutes: 45,
            questionsToAttempt: 1,
            subjects: [
              {
                id: 81,
                subject: { id: 11, code: 'GK', name: 'General Knowledge' },
                questions: [
                  {
                    id: 111,
                    marks: 2,
                    negativeMarks: 0.5,
                    questionVersion: {
                      id: 121,
                      content: '<p>Which answer is correct?</p>',
                      explanation: '<p>Because A is correct.</p>',
                      difficulty: 'MEDIUM',
                      defaultMarks: 2,
                      defaultNegativeMarks: 0.5,
                      question: { id: 131, code: 'GK-001' },
                      questionType: {
                        id: 1,
                        code: 'SINGLE_CHOICE',
                        name: 'Single Choice',
                      },
                      topic: { id: 141, code: 'BASICS', name: 'Basics' },
                      comprehension: null,
                      options: [
                        {
                          id: 151,
                          code: 'A',
                          content: 'Answer A',
                          isCorrect: true,
                          sortOrder: 0,
                        },
                        {
                          id: 152,
                          code: 'B',
                          content: 'Answer B',
                          isCorrect: false,
                          sortOrder: 1,
                        },
                      ],
                      acceptedAnswers: [
                        {
                          id: 161,
                          textValue: 'A',
                          numericValue: null,
                          sortOrder: 0,
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ],
};

function serviceWithExam() {
  let where: Record<string, unknown> | undefined;
  const client = {
    exam: {
      findFirst: (args: { where: Record<string, unknown> }) => {
        where = args.where;
        return Promise.resolve(
          args.where.organizationId === scheduledExam.organizationId
            ? structuredClone(scheduledExam)
            : null,
        );
      },
    },
  };
  return {
    service: new ExamService({ client } as unknown as ExamRepository),
    where: () => where,
  };
}

void test('exam-wise questions enforce organization scope and immutable selected slots', async () => {
  const fixture = serviceWithExam();
  const result = await fixture.service.getExamQuestions(
    {
      userId: 1,
      email: 'admin@example.com',
      organizationId: 7,
      permissions: ['exam.read'],
    },
    scheduledExam.id,
  );

  assert.equal(fixture.where()?.organizationId, 7);
  assert.equal(result.exam.template.versionId, 52);
  assert.deepEqual(
    result.slots.map((slot) => slot.templateSlotId),
    [61],
  );
  assert.equal(result.canViewAnswers, false);
});

void test('exam-wise questions redact answers without the dedicated permission', async () => {
  const { service } = serviceWithExam();
  const result = await service.getExamQuestions(
    {
      userId: 1,
      email: 'reader@example.com',
      organizationId: 7,
      permissions: ['exam.read'],
    },
    scheduledExam.id,
  );
  const version =
    result.slots[0].sections[0].subjects[0].questions[0].questionVersion;

  assert.equal(version.explanation, null);
  assert.deepEqual(version.acceptedAnswers, []);
  assert.equal(
    version.options.some((option) => option.isCorrect),
    false,
  );
});

void test('exam answer reviewers receive answers and explanations', async () => {
  const { service } = serviceWithExam();
  const result = await service.getExamQuestions(
    {
      userId: 2,
      email: 'reviewer@example.com',
      organizationId: 7,
      permissions: ['exam.read', 'exam-answer.read'],
    },
    scheduledExam.id,
  );
  const version =
    result.slots[0].sections[0].subjects[0].questions[0].questionVersion;

  assert.equal(result.canViewAnswers, true);
  assert.equal(version.explanation, '<p>Because A is correct.</p>');
  assert.equal(version.acceptedAnswers.length, 1);
  assert.equal(
    version.options.find((option) => option.code === 'A')?.isCorrect,
    true,
  );
});

void test('exam-wise questions reject cross-organization access', async () => {
  const { service } = serviceWithExam();
  await assert.rejects(
    service.getExamQuestions(
      {
        userId: 3,
        email: 'other@example.com',
        organizationId: 8,
        permissions: ['exam.read', 'exam-answer.read'],
      },
      scheduledExam.id,
    ),
    /Scheduled exam not found/,
  );
});
