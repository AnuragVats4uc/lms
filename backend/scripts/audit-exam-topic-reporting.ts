import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [
    organizations,
    versions,
    attempts,
    attemptVersions,
    unresolvedImports,
  ] = await Promise.all([
    prisma.organization.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        subjects: { select: { id: true } },
        topics: {
          select: { id: true, subjectId: true, isActive: true },
        },
        questions: { select: { id: true } },
        exams: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.questionVersion.findMany({
      select: {
        id: true,
        topicId: true,
        question: {
          select: {
            organizationId: true,
            subjectId: true,
            code: true,
            subject: { select: { code: true, name: true } },
          },
        },
        content: true,
        topic: { select: { subjectId: true, code: true } },
        _count: { select: { templateQuestions: true } },
      },
    }),
    prisma.studentExamAttempt.findMany({
      select: {
        id: true,
        status: true,
        score: true,
        sessionCourseId: true,
        sourceResourceId: true,
        calculationVersion: true,
        exam: {
          select: {
            code: true,
            title: true,
            courseAssignments: { select: { sessionCourseId: true } },
            resources: {
              select: {
                id: true,
                title: true,
                folder: { select: { sessionCourseId: true } },
              },
            },
          },
        },
      },
    }),
    prisma.studentExamAttempt.groupBy({
      by: ['calculationVersion'],
      _count: { _all: true },
      orderBy: { calculationVersion: 'asc' },
    }),
    prisma.examImportRow.count({
      where: { topicCode: { not: null }, topicId: null },
    }),
  ]);

  const versionByOrganization = new Map<
    number,
    { total: number; categorized: number; inTemplates: number }
  >();
  const topicSubjectMismatches: Array<{
    questionCode: string;
    questionSubjectId: number;
    topicSubjectId: number;
    topicCode: string;
  }> = [];
  for (const version of versions) {
    const aggregate = versionByOrganization.get(
      version.question.organizationId,
    ) ?? { total: 0, categorized: 0, inTemplates: 0 };
    aggregate.total += 1;
    if (version.topicId) aggregate.categorized += 1;
    if (version._count.templateQuestions) aggregate.inTemplates += 1;
    versionByOrganization.set(version.question.organizationId, aggregate);
    if (
      version.topic &&
      version.topic.subjectId !== version.question.subjectId
    ) {
      topicSubjectMismatches.push({
        questionCode: version.question.code,
        questionSubjectId: version.question.subjectId,
        topicSubjectId: version.topic.subjectId,
        topicCode: version.topic.code,
      });
    }
  }

  const organizationCoverage = organizations.map((organization) => {
    const coverage = versionByOrganization.get(organization.id) ?? {
      total: 0,
      categorized: 0,
      inTemplates: 0,
    };
    return {
      organizationId: organization.id,
      code: organization.code,
      name: organization.name,
      subjects: organization.subjects.length,
      activeTopics: organization.topics.filter((topic) => topic.isActive)
        .length,
      inactiveTopics: organization.topics.filter((topic) => !topic.isActive)
        .length,
      questions: organization.questions.length,
      questionVersions: coverage.total,
      categorizedVersions: coverage.categorized,
      uncategorizedVersions: coverage.total - coverage.categorized,
      coveragePercent: coverage.total
        ? Math.round((coverage.categorized / coverage.total) * 10_000) / 100
        : 0,
      templateUsedVersions: coverage.inTemplates,
      exams: organization.exams.length,
    };
  });
  const completedAttempts = attempts.filter(
    (attempt) => attempt.score !== null,
  ).length;
  const contextReadyAttempts = attempts.filter(
    (attempt) => attempt.sessionCourseId && attempt.sourceResourceId,
  ).length;
  const questionBackfillCandidates = versions
    .filter((version) => !version.topicId)
    .map((version) => ({
      questionVersionId: version.id,
      questionCode: version.question.code,
      subjectCode: version.question.subject.code,
      subjectName: version.question.subject.name,
      contentPreview: version.content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 140),
      usedInTemplates: version._count.templateQuestions,
    }));
  const historicalAttemptBackfill = attempts
    .filter((attempt) => !attempt.sessionCourseId || !attempt.sourceResourceId)
    .map((attempt) => {
      const assignedCourseIds = new Set(
        attempt.exam.courseAssignments.map((item) => item.sessionCourseId),
      );
      const matchingResources = attempt.exam.resources.filter((resource) =>
        assignedCourseIds.has(resource.folder.sessionCourseId),
      );
      const uniqueResource =
        matchingResources.length === 1 ? matchingResources[0] : null;
      return {
        attemptId: attempt.id,
        examCode: attempt.exam.code,
        examTitle: attempt.exam.title,
        currentSessionCourseId: attempt.sessionCourseId,
        currentSourceResourceId: attempt.sourceResourceId,
        assignedCourseIds: [...assignedCourseIds],
        matchingResources: matchingResources.map((resource) => ({
          resourceId: resource.id,
          resourceTitle: resource.title,
          sessionCourseId: resource.folder.sessionCourseId,
        })),
        deterministicCandidate: uniqueResource
          ? {
              sessionCourseId: uniqueResource.folder.sessionCourseId,
              sourceResourceId: uniqueResource.id,
            }
          : null,
      };
    });
  const result = {
    generatedAt: new Date().toISOString(),
    organizations: organizationCoverage,
    totals: {
      organizations: organizations.length,
      subjects: organizationCoverage.reduce(
        (total, item) => total + item.subjects,
        0,
      ),
      activeTopics: organizationCoverage.reduce(
        (total, item) => total + item.activeTopics,
        0,
      ),
      questions: organizationCoverage.reduce(
        (total, item) => total + item.questions,
        0,
      ),
      questionVersions: versions.length,
      categorizedVersions: versions.filter((version) => version.topicId).length,
      uncategorizedVersions: versions.filter((version) => !version.topicId)
        .length,
    },
    reporting: {
      attempts: attempts.length,
      completedAttempts,
      contextReadyAttempts,
      historicalAttemptsWithoutContext: attempts.length - contextReadyAttempts,
      calculationVersions: attemptVersions.map((item) => ({
        version: item.calculationVersion,
        attempts: item._count._all,
      })),
    },
    imports: { unresolvedTopicCodes: unresolvedImports },
    integrity: { topicSubjectMismatches },
    backfill: {
      questionCandidates: questionBackfillCandidates,
      historicalAttempts: historicalAttemptBackfill,
      deterministicHistoricalAttempts: historicalAttemptBackfill.filter(
        (attempt) => attempt.deterministicCandidate,
      ).length,
    },
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\nEXAM TOPIC & REPORTING AUDIT');
    console.table(organizationCoverage);
    console.log('Totals:', result.totals);
    console.log('Reporting:', result.reporting);
    console.log('Imports:', result.imports);
    console.log('Integrity:', result.integrity);
    console.log('\nUncategorized question versions:');
    console.table(questionBackfillCandidates);
    console.log('\nHistorical attempt context candidates:');
    console.dir(historicalAttemptBackfill, { depth: null });
  }

  if (topicSubjectMismatches.length) {
    throw new Error(
      `${topicSubjectMismatches.length} question version(s) reference a topic from another subject`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
