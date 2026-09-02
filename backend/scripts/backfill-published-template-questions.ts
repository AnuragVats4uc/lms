import 'dotenv/config';
import {
  ExamTemplateVersionStatus,
  PrismaClient,
  QuestionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const links = await prisma.examTemplateQuestion.findMany({
    where: {
      sectionSubject: {
        examTemplateSection: {
          examTemplateSlot: {
            examTemplateVersion: {
              status: ExamTemplateVersionStatus.PUBLISHED,
            },
          },
        },
      },
      OR: [
        { questionVersion: { isPublished: false } },
        {
          questionVersion: {
            question: { status: { not: QuestionStatus.PUBLISHED } },
          },
        },
      ],
    },
    select: {
      questionVersionId: true,
      questionVersion: {
        select: {
          isPublished: true,
          questionId: true,
          question: { select: { code: true, status: true } },
        },
      },
    },
  });

  const questionVersionIds = [
    ...new Set(links.map((item) => item.questionVersionId)),
  ];
  const questionIds = [
    ...new Set(links.map((item) => item.questionVersion.questionId)),
  ];

  console.log(
    `Published-template publication audit: ${questionVersionIds.length} question version(s), ${questionIds.length} question(s) require correction.`,
  );
  console.table(
    links.slice(0, 50).map((item) => ({
      questionCode: item.questionVersion.question.code,
      questionStatus: item.questionVersion.question.status,
      questionVersionId: item.questionVersionId,
      versionPublished: item.questionVersion.isPublished,
    })),
  );

  if (!questionVersionIds.length) return;
  if (!apply) {
    console.log(
      'Dry run only. Re-run with --apply after reviewing the audit and database backup.',
    );
    return;
  }

  const [versions, questions] = await prisma.$transaction([
    prisma.questionVersion.updateMany({
      where: { id: { in: questionVersionIds }, isPublished: false },
      data: { isPublished: true },
    }),
    prisma.question.updateMany({
      where: {
        id: { in: questionIds },
        status: { not: QuestionStatus.PUBLISHED },
      },
      data: { status: QuestionStatus.PUBLISHED },
    }),
  ]);

  console.log(
    `Backfill complete: ${versions.count} question version(s) and ${questions.count} question(s) updated. No records were deleted or recreated.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
