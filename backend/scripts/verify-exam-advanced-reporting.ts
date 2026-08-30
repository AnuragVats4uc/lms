import 'dotenv/config';
import assert from 'node:assert/strict';
import { ExamAttemptStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiUrl =
  process.env.EXAM_VERIFY_API_URL ?? 'http://localhost:5000/api/v1';

const accounts = {
  admin: ['admin@lmsdemo.example.com', 'DemoAdmin@2026!'],
  student: ['student@lmsdemo.example.com', 'DemoStudent@2026!'],
} as const;

type AuthSession = { accessToken: string; refreshToken: string };
type Envelope<T> = { success: boolean; data: T };
type StudentReport = {
  released: boolean;
  summary: { completionRate: number };
  timeAnalysis: {
    averageTimePerQuestion: number;
    averageTimePerAttemptedQuestion: number;
  };
  result: { status: string; passingPercentage: number | null };
  questions?: Array<{ studentAnswer: unknown; correctAnswer?: unknown }>;
};
type AdminReport = {
  summary: {
    averageAccuracy: number;
    averageCompletionRate: number;
    averageDurationSeconds: number;
    passRate: number | null;
  };
  performance: { sections: unknown[]; topics: unknown[] };
  students: Array<{ resultStatus: string }>;
};

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  });
  return {
    status: response.status,
    body: (await response.json()) as Envelope<T>,
  };
}

async function login([email, password]: readonly [string, string]) {
  const response = await request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `Login failed for ${email}`);
  return response.body.data;
}

async function logout(session: AuthSession) {
  await request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
}

async function main() {
  const attempt = await prisma.studentExamAttempt.findFirst({
    where: {
      exam: { code: 'DEMO-FOUNDATION-CHECK' },
      student: { user: { email: accounts.student[0] } },
      status: {
        in: [
          ExamAttemptStatus.SUBMITTED,
          ExamAttemptStatus.AUTO_SUBMITTED,
          ExamAttemptStatus.EVALUATED,
        ],
      },
    },
    select: { id: true, uuid: true, examId: true },
    orderBy: { submittedAt: 'desc' },
  });
  assert.ok(attempt, 'No completed demo student attempt is available');

  const [adminSession, studentSession] = await Promise.all([
    login(accounts.admin),
    login(accounts.student),
  ]);
  const adminHeaders = {
    authorization: `Bearer ${adminSession.accessToken}`,
  };
  const studentHeaders = {
    authorization: `Bearer ${studentSession.accessToken}`,
  };

  try {
    const studentResponse = await request<StudentReport>(
      `/students/me/exam-attempts/${attempt.id}/${attempt.uuid}/report`,
      { headers: studentHeaders },
    );
    assert.equal(studentResponse.status, 200);
    const studentReport = studentResponse.body.data;
    assert.equal(studentReport.released, true);
    assert.equal(typeof studentReport.summary.completionRate, 'number');
    assert.equal(
      typeof studentReport.timeAnalysis.averageTimePerQuestion,
      'number',
    );
    assert.equal(
      typeof studentReport.timeAnalysis.averageTimePerAttemptedQuestion,
      'number',
    );
    assert.equal(studentReport.result.passingPercentage, 60);
    assert.ok(studentReport.questions?.every((item) => item.studentAnswer));
    assert.ok(studentReport.questions?.every((item) => item.correctAnswer));

    const adminResponse = await request<AdminReport>(
      `/exams/${attempt.examId}/report`,
      { headers: adminHeaders },
    );
    assert.equal(adminResponse.status, 200);
    const adminReport = adminResponse.body.data;
    assert.equal(typeof adminReport.summary.averageAccuracy, 'number');
    assert.equal(typeof adminReport.summary.averageCompletionRate, 'number');
    assert.equal(typeof adminReport.summary.averageDurationSeconds, 'number');
    assert.ok(adminReport.performance.sections.length > 0);
    assert.ok(adminReport.performance.topics.length > 0);
    assert.ok(
      adminReport.students.every((student) =>
        ['PASSED', 'FAILED', 'NOT_CONFIGURED'].includes(student.resultStatus),
      ),
    );

    const forbidden = await request(`/exams/${attempt.examId}/report`, {
      headers: studentHeaders,
    });
    assert.equal(forbidden.status, 403);

    console.table({
      studentReport: {
        result: studentReport.result.status,
        completion: `${studentReport.summary.completionRate}%`,
        records: `${studentReport.questions?.length ?? 0} questions`,
      },
      adminReport: {
        result: `${adminReport.students.length} ranked students`,
        completion: `${adminReport.summary.averageCompletionRate}%`,
        records: `${adminReport.performance.topics.length} topics`,
      },
    });
    console.log('Student access to the administrative report: denied (403).');
  } finally {
    await Promise.allSettled([logout(adminSession), logout(studentSession)]);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
