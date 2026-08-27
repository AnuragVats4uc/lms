import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Prisma, PrismaClient } from '@prisma/client';

type TopicMapping = {
  subjectCode: string;
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
  questionCodes: string[];
};

type MappingFile = {
  organizationCode: string;
  topics: TopicMapping[];
};

const prisma = new PrismaClient();
const applyChanges = process.argv.includes('--apply');
const mappingArgument = process.argv.find((argument) =>
  argument.startsWith('--mapping='),
);
const mappingPath = resolve(
  process.cwd(),
  mappingArgument?.slice('--mapping='.length) ??
    'scripts/exam-topic-backfill.lms-demo.json',
);

async function loadAndValidateMapping() {
  const mapping = JSON.parse(
    await readFile(mappingPath, 'utf8'),
  ) as MappingFile;
  if (!mapping.organizationCode?.trim() || !mapping.topics?.length)
    throw new Error('The mapping must include organizationCode and topics.');

  const organization = await prisma.organization.findUnique({
    where: { code: mapping.organizationCode.trim() },
    select: {
      id: true,
      code: true,
      name: true,
      subjects: { select: { id: true, code: true, name: true } },
    },
  });
  if (!organization)
    throw new Error(`Organization ${mapping.organizationCode} was not found.`);

  const subjectByCode = new Map(
    organization.subjects.map((subject) => [subject.code, subject]),
  );
  const questionOwner = new Map<string, string>();
  for (const topic of mapping.topics) {
    if (!subjectByCode.has(topic.subjectCode))
      throw new Error(
        `Topic ${topic.code} references missing subject ${topic.subjectCode}.`,
      );
    if (
      !topic.code?.trim() ||
      !topic.name?.trim() ||
      !topic.questionCodes.length
    )
      throw new Error(
        `Every topic needs a code, name, and at least one question code.`,
      );
    for (const code of topic.questionCodes) {
      const previousTopic = questionOwner.get(code);
      if (previousTopic)
        throw new Error(
          `Question ${code} appears in both ${previousTopic} and ${topic.code}.`,
        );
      questionOwner.set(code, topic.code);
    }
  }

  const questions = await prisma.question.findMany({
    where: {
      organizationId: organization.id,
      code: { in: [...questionOwner.keys()] },
    },
    select: {
      id: true,
      code: true,
      subjectId: true,
      versions: {
        select: {
          id: true,
          topicId: true,
          topic: { select: { code: true } },
        },
      },
    },
  });
  const questionByCode = new Map(
    questions.map((question) => [question.code, question]),
  );
  const missingQuestions = [...questionOwner.keys()].filter(
    (code) => !questionByCode.has(code),
  );
  if (missingQuestions.length)
    throw new Error(`Missing mapped questions: ${missingQuestions.join(', ')}`);

  for (const topic of mapping.topics) {
    const subject = subjectByCode.get(topic.subjectCode)!;
    for (const code of topic.questionCodes) {
      const question = questionByCode.get(code)!;
      if (question.subjectId !== subject.id)
        throw new Error(
          `Question ${code} does not belong to subject ${topic.subjectCode}.`,
        );
      const conflicts = question.versions.filter(
        (version) => version.topic && version.topic.code !== topic.code,
      );
      if (conflicts.length)
        throw new Error(
          `Question ${code} already has a conflicting topic on version(s): ${conflicts
            .map((version) => version.id)
            .join(', ')}.`,
        );
    }
  }

  return { mapping, organization, subjectByCode, questionByCode };
}

async function loadAttemptCandidates() {
  const attempts = await prisma.studentExamAttempt.findMany({
    where: { OR: [{ sessionCourseId: null }, { sourceResourceId: null }] },
    select: {
      id: true,
      sessionCourseId: true,
      sourceResourceId: true,
      exam: {
        select: {
          code: true,
          courseAssignments: { select: { sessionCourseId: true } },
          resources: {
            select: {
              id: true,
              folder: { select: { sessionCourseId: true } },
            },
          },
        },
      },
    },
  });
  return attempts.map((attempt) => {
    const assignedCourseIds = new Set(
      attempt.exam.courseAssignments.map((item) => item.sessionCourseId),
    );
    const resources = attempt.exam.resources.filter((resource) =>
      assignedCourseIds.has(resource.folder.sessionCourseId),
    );
    const candidate = resources.length === 1 ? resources[0] : null;
    const conflicts = Boolean(
      candidate &&
      ((attempt.sessionCourseId &&
        attempt.sessionCourseId !== candidate.folder.sessionCourseId) ||
        (attempt.sourceResourceId &&
          attempt.sourceResourceId !== candidate.id)),
    );
    return {
      attemptId: attempt.id,
      examCode: attempt.exam.code,
      candidate: candidate
        ? {
            sessionCourseId: candidate.folder.sessionCourseId,
            sourceResourceId: candidate.id,
          }
        : null,
      conflicts,
    };
  });
}

async function main() {
  const { mapping, organization, subjectByCode, questionByCode } =
    await loadAndValidateMapping();
  const attemptCandidates = await loadAttemptCandidates();
  const deterministicAttempts = attemptCandidates.filter(
    (attempt) => attempt.candidate && !attempt.conflicts,
  );
  const skippedAttempts = attemptCandidates.filter(
    (attempt) => !attempt.candidate || attempt.conflicts,
  );
  const mappedVersionCount = mapping.topics.reduce(
    (total, topic) =>
      total +
      topic.questionCodes.reduce(
        (count, code) => count + questionByCode.get(code)!.versions.length,
        0,
      ),
    0,
  );

  console.log('\nEXAM TOPIC & REPORTING BACKFILL');
  console.log(`Mode:         ${applyChanges ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Mapping:      ${mappingPath}`);
  console.log(`Organization: ${organization.name} (${organization.code})`);
  console.log(`Topics:       ${mapping.topics.length}`);
  console.log(`Questions:    ${questionByCode.size}`);
  console.log(`Versions:     ${mappedVersionCount}`);
  console.log(`Attempts:     ${deterministicAttempts.length} deterministic`);
  console.log(`Skipped:      ${skippedAttempts.length}`);

  if (!applyChanges) {
    console.log(
      '\nDry run complete. Re-run with --apply to persist this plan.',
    );
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      for (const topic of mapping.topics) {
        const subject = subjectByCode.get(topic.subjectCode)!;
        const record = await tx.topic.upsert({
          where: {
            subjectId_code: { subjectId: subject.id, code: topic.code },
          },
          update: {
            name: topic.name,
            description: topic.description,
            sortOrder: topic.sortOrder ?? 0,
            isActive: true,
          },
          create: {
            organizationId: organization.id,
            subjectId: subject.id,
            code: topic.code,
            name: topic.name,
            description: topic.description,
            sortOrder: topic.sortOrder ?? 0,
            isActive: true,
          },
        });
        const questionIds = topic.questionCodes.map(
          (code) => questionByCode.get(code)!.id,
        );
        await tx.questionVersion.updateMany({
          where: { questionId: { in: questionIds } },
          data: { topicId: record.id },
        });
      }

      for (const attempt of deterministicAttempts) {
        await tx.studentExamAttempt.update({
          where: { id: attempt.attemptId },
          data: {
            sessionCourseId: attempt.candidate!.sessionCourseId,
            sourceResourceId: attempt.candidate!.sourceResourceId,
          },
        });
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  console.log('\nBackfill applied successfully.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
