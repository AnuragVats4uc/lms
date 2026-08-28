import 'dotenv/config';
import { ExamAttemptStatus, PrismaClient } from '@prisma/client';

import { seedDemoExamAttemptDetails } from '../prisma/seed/demo-exam-attempt-details';

const prisma = new PrismaClient();

async function main() {
  const exam = await prisma.exam.findFirst({
    where: {
      code: 'DEMO-FOUNDATION-CHECK',
      organization: { code: 'LMS-DEMO' },
    },
    select: {
      id: true,
      attempts: {
        where: {
          attemptNumber: { in: [1, 2] },
          status: {
            in: [
              ExamAttemptStatus.SUBMITTED,
              ExamAttemptStatus.AUTO_SUBMITTED,
              ExamAttemptStatus.EVALUATED,
            ],
          },
        },
        select: { id: true },
      },
    },
  });
  if (!exam) throw new Error('Demo foundation exam not found');
  await seedDemoExamAttemptDetails(
    prisma,
    exam.id,
    exam.attempts.map((attempt) => attempt.id),
  );
  console.log(
    `Enriched ${exam.attempts.length} completed demo attempt(s) for reporting.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
