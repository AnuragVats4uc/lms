import 'dotenv/config';
import assert from 'node:assert/strict';
import {
  ExamAttemptStatus,
  ExamNavigationMode,
  ExamStatus,
  ExamTemplateStatus,
  ExamTemplateVersionStatus,
  PrismaClient,
  QuestionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const apiUrl =
  process.env.EXAM_VERIFY_API_URL ?? 'http://localhost:5000/api/v1';
const fixtureCode = 'E2E-STUDENT-EXAM-LIFECYCLE';
const fixtureTemplateCode = `TPL-${fixtureCode}`;
const fixtureQuestionCode = 'E2E-PASSAGE-IMAGE-QUESTION';
const fixtureComprehensionCode = 'E2E-PASSAGE-IMAGE-CONTEXT';
const accounts = {
  admin: ['admin@lmsdemo.example.com', 'DemoAdmin@2026!'],
  student: ['aarav.sharma@lms.test', 'LmsStudent@01!'],
  otherStudent: ['diya.patel@lms.test', 'LmsStudent@02!'],
} as const;

type AuthSession = { accessToken: string; refreshToken: string };
type Envelope<T> = { success: boolean; data: T };
type AttemptQuestion = {
  id: number;
  content: string;
  comprehension: { code: string; content: string } | null;
  questionType: { code: 'SINGLE_CHOICE' | 'NUMERIC' | 'ONE_WORD' };
  state: {
    answered: boolean;
    markedForReview: boolean;
    selectedOptionIds: number[];
    textAnswer: string;
    numericAnswer: number | null;
  };
};
type AttemptResponse = {
  attemptUuid: string;
  status: string;
  timeoutState: {
    scope: 'EXAM' | 'SLOT' | 'SECTION';
    autoSubmitOnTimeout: boolean;
  } | null;
  questions: AttemptQuestion[];
};

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  });
  let body: Envelope<T> | Record<string, unknown> = {};
  const text = await response.text();
  if (text) body = JSON.parse(text) as Envelope<T>;
  return { status: response.status, body };
}

function data<T>(response: Awaited<ReturnType<typeof request<T>>>) {
  return (response.body as Envelope<T>).data;
}

async function login([email, password]: readonly [string, string]) {
  const response = await request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `Login failed for ${email}`);
  return data(response);
}

async function logout(session: AuthSession) {
  await request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
}

async function cleanupFixture() {
  const exams = await prisma.exam.findMany({
    where: {
      code: fixtureCode,
      organization: { code: 'LMS-DEMO' },
    },
    select: {
      id: true,
      resources: { select: { id: true } },
      attempts: { select: { id: true } },
    },
  });
  const examIds = exams.map((exam) => exam.id);
  const resourceIds = exams.flatMap((exam) =>
    exam.resources.map((resource) => resource.id),
  );
  const attemptIds = exams.flatMap((exam) =>
    exam.attempts.map((attempt) => attempt.id),
  );
  if (examIds.length) {
    await prisma.studentActivityEvent.deleteMany({
      where: {
        OR: [
          { examAttemptId: { in: attemptIds } },
          { resourceId: { in: resourceIds } },
        ],
      },
    });
    await prisma.studentExamAttempt.deleteMany({
      where: { examId: { in: examIds } },
    });
    await prisma.resource.deleteMany({ where: { id: { in: resourceIds } } });
    await prisma.exam.deleteMany({ where: { id: { in: examIds } } });
  }
  await prisma.examTemplate.deleteMany({
    where: {
      code: fixtureTemplateCode,
      organization: { code: 'LMS-DEMO' },
    },
  });
  await prisma.question.deleteMany({
    where: {
      code: fixtureQuestionCode,
      organization: { code: 'LMS-DEMO' },
    },
  });
  await prisma.questionComprehension.deleteMany({
    where: {
      code: fixtureComprehensionCode,
      organization: { code: 'LMS-DEMO' },
    },
  });
  const remaining = await Promise.all([
    prisma.exam.count({ where: { code: fixtureCode } }),
    prisma.examTemplate.count({ where: { code: fixtureTemplateCode } }),
    prisma.question.count({ where: { code: fixtureQuestionCode } }),
    prisma.questionComprehension.count({
      where: { code: fixtureComprehensionCode },
    }),
  ]);
  assert.deepEqual(remaining, [0, 0, 0, 0], 'E2E fixture cleanup failed');
}

async function fixtureSource() {
  const source = await prisma.exam.findFirst({
    where: {
      code: 'SEED-MIXED-MOCK',
      organization: { code: 'LMS-DEMO' },
    },
    include: {
      templateVersion: {
        include: {
          slots: {
            orderBy: { sortOrder: 'asc' },
            include: {
              sections: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  subjects: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                      questions: { orderBy: { sortOrder: 'asc' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      courseAssignments: true,
      resources: { include: { folder: true } },
    },
  });
  assert.ok(source, 'SEED-MIXED-MOCK is required for lifecycle verification');
  const sessionCourseId = source.courseAssignments[0]?.sessionCourseId;
  const resourceFolderId = source.resources[0]?.folderId;
  assert.ok(sessionCourseId && resourceFolderId);
  for (const email of [accounts.student[0], accounts.otherStudent[0]]) {
    const enrollment = await prisma.studentCourseEnrollment.count({
      where: {
        sessionCourseId,
        isActive: true,
        enrollment: {
          isActive: true,
          student: { user: { email } },
        },
      },
    });
    assert.ok(enrollment, `${email} is not enrolled in the fixture course`);
  }
  const sourceSlot = source.templateVersion.slots[0];
  const firstSubject = sourceSlot?.sections[0]?.subjects[0];
  assert.ok(sourceSlot && firstSubject);
  const singleChoiceType = await prisma.questionType.findUnique({
    where: { code: 'SINGLE_CHOICE' },
  });
  assert.ok(singleChoiceType);
  const comprehension = await prisma.questionComprehension.create({
    data: {
      organizationId: source.organizationId,
      code: fixtureComprehensionCode,
      content:
        '<p>A learner studies the chart and passage before selecting an answer.</p>',
    },
  });
  const fixtureQuestion = await prisma.question.create({
    data: {
      organizationId: source.organizationId,
      subjectId: firstSubject.subjectId,
      code: fixtureQuestionCode,
      status: QuestionStatus.PUBLISHED,
      versions: {
        create: {
          questionTypeId: singleChoiceType.id,
          comprehensionId: comprehension.id,
          versionNumber: 1,
          content:
            '<p><img src="/exam-question-bank-assets/hero-question-document.png" alt="Assessment document illustration" /></p><p>Which element is shown in the image?</p>',
          explanation: 'The illustration depicts an assessment document.',
          defaultMarks: 2,
          defaultNegativeMarks: 0,
          isPublished: true,
          options: {
            create: [
              {
                code: 'A',
                content: 'Assessment document',
                isCorrect: true,
                sortOrder: 1,
              },
              {
                code: 'B',
                content: 'Video player',
                isCorrect: false,
                sortOrder: 2,
              },
            ],
          },
        },
      },
    },
    include: { versions: true },
  });
  const template = await prisma.examTemplate.create({
    data: {
      organizationId: source.organizationId,
      code: fixtureTemplateCode,
      name: 'E2E Student Exam Lifecycle Template',
      status: ExamTemplateStatus.PUBLISHED,
    },
  });
  const version = await prisma.examTemplateVersion.create({
    data: {
      examTemplateId: template.id,
      versionNumber: 1,
      instructions: 'Lifecycle verification with mixed content.',
      defaultDurationMinutes: 30,
      defaultAttemptLimit: 3,
      enforceSlotTimers: true,
      enforceSectionTimers: true,
      status: ExamTemplateVersionStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });
  const slot = await prisma.examTemplateSlot.create({
    data: {
      examTemplateVersionId: version.id,
      code: `${fixtureCode}-SLOT`,
      name: 'Lifecycle Slot',
      durationMinutes: 30,
      navigationMode: ExamNavigationMode.FREE,
      autoSubmitOnTimeout: true,
      sortOrder: 1,
    },
  });
  for (const [sectionIndex, sourceSection] of sourceSlot.sections.entries()) {
    const questionCount = sourceSection.subjects.reduce(
      (total, subject) => total + subject.questions.length,
      0,
    );
    const section = await prisma.examTemplateSection.create({
      data: {
        examTemplateSlotId: slot.id,
        code: `E2E-${sourceSection.code}`,
        name: sourceSection.name,
        durationMinutes: 10,
        questionsToAttempt: questionCount + (sectionIndex === 0 ? 1 : 0),
        randomizeQuestions: false,
        randomizeOptions: false,
        navigationMode: ExamNavigationMode.FREE,
        allowReview: true,
        autoSubmitOnTimeout: true,
        sortOrder: sectionIndex + 1,
      },
    });
    for (const [
      subjectIndex,
      sourceSubject,
    ] of sourceSection.subjects.entries()) {
      const subject = await prisma.examTemplateSectionSubject.create({
        data: {
          examTemplateSectionId: section.id,
          subjectId: sourceSubject.subjectId,
          sortOrder: subjectIndex + 1,
        },
      });
      await prisma.examTemplateQuestion.createMany({
        data: sourceSubject.questions.map((question) => ({
          examTemplateSectionSubjectId: subject.id,
          questionVersionId: question.questionVersionId,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          isMandatory: question.isMandatory,
          sortOrder: question.sortOrder,
        })),
      });
      if (sectionIndex === 0 && subjectIndex === 0) {
        await prisma.examTemplateQuestion.create({
          data: {
            examTemplateSectionSubjectId: subject.id,
            questionVersionId: fixtureQuestion.versions[0]!.id,
            marks: 2,
            negativeMarks: 0,
            sortOrder: sourceSubject.questions.length + 1,
          },
        });
      }
    }
  }
  return {
    source,
    sessionCourseId,
    resourceFolderId,
    fixtureVersionId: version.id,
    fixtureSlotId: slot.id,
  };
}

async function correctPayloads(attemptUuid: string) {
  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { uuid: attemptUuid },
    include: {
      questions: {
        include: {
          templateQuestion: {
            include: {
              questionVersion: {
                include: {
                  questionType: true,
                  options: { orderBy: { sortOrder: 'asc' } },
                  acceptedAnswers: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      },
    },
  });
  assert.ok(attempt);
  return new Map(
    attempt.questions.map((question) => {
      const version = question.templateQuestion.questionVersion;
      const correctOption = version.options.find((option) => option.isCorrect);
      const wrongOption = version.options.find((option) => !option.isCorrect);
      const accepted = version.acceptedAnswers[0];
      return [
        question.id,
        {
          code: version.questionType.code,
          correct:
            version.questionType.code === 'SINGLE_CHOICE'
              ? { selectedOptionIds: [correctOption!.id] }
              : version.questionType.code === 'NUMERIC'
                ? { numericAnswer: Number(accepted!.numericValue) }
                : { textAnswer: accepted!.textValue },
          incorrect:
            version.questionType.code === 'SINGLE_CHOICE'
              ? { selectedOptionIds: [wrongOption!.id] }
              : version.questionType.code === 'NUMERIC'
                ? { numericAnswer: Number(accepted!.numericValue) + 999 }
                : { textAnswer: 'definitely-wrong' },
        },
      ] as const;
    }),
  );
}

async function main() {
  await cleanupFixture();
  const {
    source,
    sessionCourseId,
    resourceFolderId,
    fixtureVersionId,
    fixtureSlotId,
  } = await fixtureSource();
  const [adminSession, studentSession, otherStudentSession] = await Promise.all(
    [
      login(accounts.admin),
      login(accounts.student),
      login(accounts.otherStudent),
    ],
  );
  const adminHeaders = {
    authorization: `Bearer ${adminSession.accessToken}`,
  };
  const studentHeaders = {
    authorization: `Bearer ${studentSession.accessToken}`,
  };
  const otherStudentHeaders = {
    authorization: `Bearer ${otherStudentSession.accessToken}`,
  };

  try {
    const now = Date.now();
    const createResponse = await request<{ id: number }>('/exams', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        sessionId: source.sessionId,
        examTemplateVersionId: fixtureVersionId,
        code: fixtureCode,
        title: 'E2E Student Exam Lifecycle',
        instructions: 'Temporary deterministic lifecycle verification.',
        availableFrom: new Date(now - 60_000).toISOString(),
        availableUntil: new Date(now + 86_400_000).toISOString(),
        durationMinutes: 30,
        attemptLimit: 3,
        passingPercentage: 60,
        autoSubmitOnTimeout: true,
        allowResume: true,
        resultReleaseMode: 'IMMEDIATE',
        showScore: true,
        showQuestionReview: true,
        showCorrectAnswers: true,
        showExplanations: true,
        status: ExamStatus.SCHEDULED,
        selectedSlotIds: [fixtureSlotId],
        sessionCourseIds: [sessionCourseId],
        resourceFolderId,
      }),
    });
    assert.equal(createResponse.status, 201);
    const examId = data(createResponse).id;
    const resource = await prisma.resource.findFirst({
      where: { examId },
      select: { id: true },
    });
    assert.ok(resource);

    const detailResponse = await request(
      `/students/me/resources/${resource.id}/exam`,
      { headers: studentHeaders },
    );
    assert.equal(detailResponse.status, 200);

    const startResponse = await request<{
      attemptUuid: string;
      resumed: boolean;
    }>(`/students/me/resources/${resource.id}/exam/start`, {
      method: 'POST',
      headers: studentHeaders,
    });
    assert.equal(startResponse.status, 201);
    const firstAttemptUuid = data(startResponse).attemptUuid;
    assert.equal(data(startResponse).resumed, false);

    const concurrentStarts = await Promise.all([
      request<{ attemptUuid: string; resumed: boolean }>(
        `/students/me/resources/${resource.id}/exam/start`,
        { method: 'POST', headers: studentHeaders },
      ),
      request<{ attemptUuid: string; resumed: boolean }>(
        `/students/me/resources/${resource.id}/exam/start`,
        { method: 'POST', headers: studentHeaders },
      ),
    ]);
    for (const response of concurrentStarts) {
      assert.ok([200, 201].includes(response.status));
      assert.equal(data(response).attemptUuid, firstAttemptUuid);
      assert.equal(data(response).resumed, true);
    }

    const attemptResponse = await request<AttemptResponse>(
      `/students/me/exam-attempts/${firstAttemptUuid}`,
      { headers: studentHeaders },
    );
    assert.equal(attemptResponse.status, 200);
    const attempt = data(attemptResponse);
    assert.ok(attempt.questions.length >= 3);
    assert.deepEqual(
      new Set(attempt.questions.map((question) => question.questionType.code)),
      new Set(['SINGLE_CHOICE', 'NUMERIC', 'ONE_WORD']),
    );
    assert.ok(
      attempt.questions.some(
        (question) =>
          question.comprehension?.code === fixtureComprehensionCode &&
          question.content.includes('<img'),
      ),
      'Passage and image question was not delivered to the attempt',
    );
    const payloads = await correctPayloads(firstAttemptUuid);

    const choiceQuestion = attempt.questions.find(
      (question) => question.questionType.code === 'SINGLE_CHOICE',
    )!;
    const invalidAnswer = await request(
      `/students/me/exam-attempts/${firstAttemptUuid}/answers/${choiceQuestion.id}`,
      {
        method: 'PATCH',
        headers: studentHeaders,
        body: JSON.stringify({ numericAnswer: 1 }),
      },
    );
    assert.equal(invalidAnswer.status, 400);

    for (const [index, question] of attempt.questions.entries()) {
      const progress = await request(
        `/students/me/exam-attempts/${firstAttemptUuid}/progress`,
        {
          method: 'PATCH',
          headers: studentHeaders,
          body: JSON.stringify({
            attemptQuestionId: question.id,
            timeSpentSeconds: index + 1,
          }),
        },
      );
      assert.equal(progress.status, 200);
      if (index === attempt.questions.length - 1) continue;
      const answer = payloads.get(question.id)!;
      const saved = await request(
        `/students/me/exam-attempts/${firstAttemptUuid}/answers/${question.id}`,
        {
          method: 'PATCH',
          headers: studentHeaders,
          body: JSON.stringify({
            ...(index === 1 ? answer.incorrect : answer.correct),
            markedForReview: index === 0,
            timeSpentSeconds: 2,
          }),
        },
      );
      assert.equal(saved.status, 200);
    }

    const refreshResponse = await request<AttemptResponse>(
      `/students/me/exam-attempts/${firstAttemptUuid}`,
      { headers: studentHeaders },
    );
    assert.equal(refreshResponse.status, 200);
    const refreshed = data(refreshResponse);
    assert.equal(refreshed.questions[0]?.state.answered, true);
    assert.equal(refreshed.questions[0]?.state.markedForReview, true);
    assert.equal(
      refreshed.questions.at(-1)?.state.answered,
      false,
      'Skipped answer must remain unanswered',
    );

    const unauthorizedAttempt = await request(
      `/students/me/exam-attempts/${firstAttemptUuid}`,
      { headers: otherStudentHeaders },
    );
    assert.equal(unauthorizedAttempt.status, 404);

    const submissions = await Promise.all([
      request(`/students/me/exam-attempts/${firstAttemptUuid}/submit`, {
        method: 'POST',
        headers: studentHeaders,
      }),
      request(`/students/me/exam-attempts/${firstAttemptUuid}/submit`, {
        method: 'POST',
        headers: studentHeaders,
      }),
    ]);
    assert.ok(submissions.every((response) => response.status === 201));
    const duplicateSubmission = await request(
      `/students/me/exam-attempts/${firstAttemptUuid}/submit`,
      { method: 'POST', headers: studentHeaders },
    );
    assert.equal(duplicateSubmission.status, 201);

    const reportResponse = await request<{
      released: boolean;
      summary: {
        correct: number;
        incorrect: number;
        unattempted: number;
      };
      result: { status: string };
    }>(`/students/me/exam-attempts/${firstAttemptUuid}/report`, {
      headers: studentHeaders,
    });
    assert.equal(reportResponse.status, 200);
    const report = data(reportResponse);
    assert.equal(report.released, true);
    assert.ok(report.summary.correct > 0);
    assert.ok(report.summary.incorrect > 0);
    assert.equal(report.summary.unattempted, 1);

    const secondStart = await request<{ attemptUuid: string }>(
      `/students/me/resources/${resource.id}/exam/start`,
      { method: 'POST', headers: studentHeaders },
    );
    assert.equal(secondStart.status, 201);
    const secondAttemptUuid = data(secondStart).attemptUuid;
    await prisma.studentExamAttempt.update({
      where: { uuid: secondAttemptUuid },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    const automaticTimeout = await request<Record<string, unknown>>(
      `/students/me/exam-attempts/${secondAttemptUuid}`,
      { headers: studentHeaders },
    );
    assert.equal(automaticTimeout.status, 200);
    assert.ok(
      ['AUTO_SUBMITTED', 'EVALUATED'].includes(
        String(data(automaticTimeout).status),
      ),
    );

    await prisma.exam.update({
      where: { id: examId },
      data: { autoSubmitOnTimeout: false },
    });
    const thirdStart = await request<{ attemptUuid: string }>(
      `/students/me/resources/${resource.id}/exam/start`,
      { method: 'POST', headers: studentHeaders },
    );
    assert.equal(thirdStart.status, 201);
    const thirdAttemptUuid = data(thirdStart).attemptUuid;
    await prisma.studentExamAttempt.update({
      where: { uuid: thirdAttemptUuid },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    const manualTimeout = await request<AttemptResponse>(
      `/students/me/exam-attempts/${thirdAttemptUuid}`,
      { headers: studentHeaders },
    );
    assert.equal(manualTimeout.status, 200);
    assert.equal(data(manualTimeout).status, ExamAttemptStatus.IN_PROGRESS);
    assert.equal(data(manualTimeout).timeoutState?.scope, 'EXAM');
    assert.equal(data(manualTimeout).timeoutState?.autoSubmitOnTimeout, false);
    const continued = await request<Record<string, unknown>>(
      `/students/me/exam-attempts/${thirdAttemptUuid}/continue-after-timeout`,
      { method: 'POST', headers: studentHeaders },
    );
    assert.equal(continued.status, 201);
    assert.notEqual(
      String(data(continued).status),
      ExamAttemptStatus.IN_PROGRESS,
    );

    const exhausted = await request(
      `/students/me/resources/${resource.id}/exam/start`,
      { method: 'POST', headers: studentHeaders },
    );
    assert.equal(exhausted.status, 409);

    const adminReport = await request<{ students: unknown[] }>(
      `/exams/${examId}/report`,
      { headers: adminHeaders },
    );
    assert.equal(adminReport.status, 200);
    assert.equal(data(adminReport).students.length, 1);

    console.table({
      creation: 'Admin API scheduled and assigned fixture',
      questionTypes: 'Single choice, numeric, one word',
      content: 'Three sections, passage and image payload verified',
      persistence: 'Save, refresh, resume verified',
      submission: 'Concurrent and duplicate submit verified',
      analytics: `${report.summary.correct} correct, ${report.summary.incorrect} incorrect, 1 unattempted`,
      automaticTimeout: 'Auto-submitted',
      manualTimeout: 'Blocked, then explicitly continued',
      isolation: 'Cross-student attempt access denied',
      attemptLimit: 'Fourth start rejected',
    });
  } finally {
    await Promise.allSettled([
      logout(adminSession),
      logout(studentSession),
      logout(otherStudentSession),
    ]);
    await cleanupFixture();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
