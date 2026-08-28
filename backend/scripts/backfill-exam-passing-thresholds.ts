import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const thresholds = new Map<string, number>([
  ['DEMO-FOUNDATION-CHECK', 60],
  ['SEED-QA-PRACTICE', 60],
  ['SEED-LR-SECTIONAL', 70],
  ['SEED-VERBAL-SECTIONAL', 70],
  ['SEED-MIXED-MOCK', 70],
  ['SEED-FULL-MOCK', 70],
]);

async function main() {
  let updated = 0;
  for (const [code, passingPercentage] of thresholds) {
    const result = await prisma.exam.updateMany({
      where: {
        code,
        organization: { code: 'LMS-DEMO' },
        passingPercentage: null,
      },
      data: { passingPercentage },
    });
    updated += result.count;
  }

  const exams = await prisma.exam.findMany({
    where: {
      code: { in: [...thresholds.keys()] },
      organization: { code: 'LMS-DEMO' },
    },
    select: {
      code: true,
      title: true,
      passingPercentage: true,
      _count: { select: { attempts: true } },
    },
    orderBy: { code: 'asc' },
  });

  console.log(`Updated ${updated} demo exam passing threshold(s).`);
  console.table(
    exams.map((exam) => ({
      code: exam.code,
      title: exam.title,
      passingPercentage: Number(exam.passingPercentage),
      attemptsPreserved: exam._count.attempts,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
