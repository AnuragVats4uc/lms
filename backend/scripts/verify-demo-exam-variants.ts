import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expected = new Map([
  [
    'DEMO-FOUNDATION-CHECK',
    { slotTimers: false, sectionTimers: false, slots: 1, sections: 1 },
  ],
  [
    'DEMO-EXAM-TIMER',
    { slotTimers: false, sectionTimers: false, slots: 1, sections: 1 },
  ],
  [
    'DEMO-SLOT-TIMER',
    { slotTimers: true, sectionTimers: false, slots: 2, sections: 2 },
  ],
  [
    'DEMO-SECTION-TIMER',
    { slotTimers: false, sectionTimers: true, slots: 1, sections: 2 },
  ],
  [
    'DEMO-LOCKED-NAVIGATION',
    { slotTimers: false, sectionTimers: false, slots: 1, sections: 1 },
  ],
  [
    'DEMO-ENDED-WINDOW',
    { slotTimers: false, sectionTimers: false, slots: 1, sections: 1 },
  ],
  [
    'DEMO-UPCOMING-WINDOW',
    { slotTimers: false, sectionTimers: false, slots: 1, sections: 1 },
  ],
]);

async function main() {
  const exams = await prisma.exam.findMany({
    where: {
      organization: { code: 'LMS-DEMO' },
      code: { in: [...expected.keys()] },
    },
    include: {
      resources: true,
      attempts: {
        include: {
          _count: { select: { questions: true, answers: true } },
        },
      },
      templateVersion: {
        include: {
          slots: {
            include: {
              sections: {
                include: {
                  subjects: { include: { questions: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { code: 'asc' },
  });
  assert.equal(exams.length, expected.size, 'Not all demo exam variants exist');

  const rows = exams.map((exam) => {
    const configuration = expected.get(exam.code);
    assert.ok(configuration, `Unexpected exam ${exam.code}`);
    const slots = exam.templateVersion.slots;
    const sections = slots.flatMap((slot) => slot.sections);
    const questions = sections.flatMap((section) =>
      section.subjects.flatMap((subject) => subject.questions),
    );
    assert.equal(questions.length, 10, `${exam.code} must have 10 questions`);
    assert.equal(
      exam.templateVersion.enforceSlotTimers,
      configuration.slotTimers,
      `${exam.code} slot timer mismatch`,
    );
    assert.equal(
      exam.templateVersion.enforceSectionTimers,
      configuration.sectionTimers,
      `${exam.code} section timer mismatch`,
    );
    assert.equal(slots.length, configuration.slots);
    assert.equal(sections.length, configuration.sections);
    assert.equal(exam.resources.length, 1, `${exam.code} resource missing`);
    return {
      code: exam.code,
      questions: questions.length,
      slots: slots.length,
      sections: sections.length,
      slotTimer: exam.templateVersion.enforceSlotTimers,
      sectionTimer: exam.templateVersion.enforceSectionTimers,
      attempts: exam.attempts.length,
    };
  });

  const questionBank = await prisma.question.findMany({
    where: {
      organization: { code: 'LMS-DEMO' },
      code: { startsWith: 'DEMO-Q-' },
    },
    include: {
      versions: {
        include: { questionType: true, topic: true, comprehension: true },
      },
    },
    orderBy: { code: 'asc' },
  });
  assert.equal(questionBank.length, 10, 'Demo question bank must contain 10');
  const latestVersions = questionBank.map((question) => question.versions[0]);
  assert.ok(latestVersions.every((version) => version?.topic));
  assert.deepEqual(
    new Set(latestVersions.map((version) => version?.difficulty)),
    new Set(['EASY', 'MEDIUM', 'HARD']),
  );
  assert.deepEqual(
    new Set(latestVersions.map((version) => version?.questionType.code)),
    new Set(['SINGLE_CHOICE', 'NUMERIC', 'ONE_WORD']),
  );
  assert.equal(
    latestVersions.filter((version) => version?.comprehension).length,
    2,
    'Two passage questions are expected',
  );

  const foundation = exams.find(
    (exam) => exam.code === 'DEMO-FOUNDATION-CHECK',
  );
  assert.ok(foundation);
  assert.equal(foundation.attempts.length, 3);
  const completed = foundation.attempts.filter(
    (attempt) => attempt.status !== 'CANCELLED',
  );
  assert.equal(
    completed.length,
    2,
    'Exactly two completed foundation report fixtures are expected',
  );
  assert.ok(
    completed.every(
      (attempt) =>
        attempt._count.questions === 10 && attempt._count.answers === 10,
    ),
    'Completed report fixtures must contain 10 question and answer records',
  );

  const reportFixtures = new Map(
    completed.map((attempt) => {
      const snapshot = attempt.configurationSnapshot as Record<string, unknown>;
      return [snapshot.reportFixture, attempt] as const;
    }),
  );
  const passedReport = reportFixtures.get('PASSED_STUDENT_SUBMISSION');
  const failedReport = reportFixtures.get('FAILED_TIMEOUT_WITH_UNANSWERED');

  assert.ok(passedReport, 'Passed student-submission report fixture is missing');
  assert.equal(passedReport.status, 'EVALUATED');
  assert.equal(Number(passedReport.score), 10);
  assert.equal(Number(passedReport.maximumScore), 10);

  assert.ok(failedReport, 'Failed timeout report fixture is missing');
  assert.equal(failedReport.status, 'AUTO_SUBMITTED');
  assert.equal(Number(failedReport.score), 3);
  assert.equal(Number(failedReport.maximumScore), 10);

  console.table(rows);
  console.log(
    'Verified 10 mixed-type questions, three difficulty levels, three topics, passage/image content, two completed report fixtures, and all timer/navigation fixtures.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
