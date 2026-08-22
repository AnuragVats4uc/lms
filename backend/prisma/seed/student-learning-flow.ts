import 'dotenv/config';
import {
  ExamNavigationMode,
  ExamStatus,
  ExamTemplateStatus,
  ExamTemplateVersionStatus,
  FolderStatus,
  PrismaClient,
  QuestionStatus,
  ResourceStatus,
} from '@prisma/client';

import { RESOURCE_TYPE_IDS } from '../../src/modules/resource/constants/resource-type.constants';
import { disconnectLmsResourceSeed, seedLmsResources } from './lms-resources';
import { seedResourceTypes } from './resource-types';

const prisma = new PrismaClient();
const ORG_CODE = 'LMS-DEMO';
const SESSION_CODE = 'IPMAT-2027';
const seedExamCodes = [
  'SEED-QA-PRACTICE',
  'SEED-LR-SECTIONAL',
  'SEED-VERBAL-SECTIONAL',
  'SEED-MIXED-MOCK',
  'SEED-FULL-MOCK',
] as const;
const examResourceUuids = seedExamCodes.map(
  (_, index) => `5eed0000-010${index + 1}-4000-8000-00000000010${index + 1}`,
);
const learningResourceUuids = Array.from(
  { length: 10 },
  (_, index) =>
    `5eed0000-${String(index + 1).padStart(4, '0')}-4000-8000-${String(index + 1).padStart(12, '0')}`,
);

const questionTypes = {
  SINGLE_CHOICE: 1,
  NUMERIC: 2,
  ONE_WORD: 3,
} as const;

type SeedQuestion = {
  code: string;
  subject: 'QA' | 'VA' | 'LR';
  type: keyof typeof questionTypes;
  content: string;
  explanation: string;
  answer: string;
  options?: [string, string][];
  marks: number;
  negativeMarks: number;
};

const questions: SeedQuestion[] = [
  mcq(
    'SEED-QA-001',
    'QA',
    'What is the remainder when 7³ is divided by 5?',
    ['1', '2', '3', '4'],
    2,
    'The powers of 7 repeat modulo 5; 343 leaves remainder 3.',
  ),
  numeric(
    'SEED-QA-002',
    'QA',
    'A product marked at ₹800 is sold after a 15% discount. Enter the selling price.',
    '680',
    'Fifteen percent of 800 is 120, so the selling price is 680.',
  ),
  mcq(
    'SEED-QA-003',
    'QA',
    'If x:y = 3:5 and y:z = 10:7, what is x:z?',
    ['3:7', '6:7', '7:6', '5:7'],
    1,
    'Make y equal: 3:5 becomes 6:10, hence x:z = 6:7.',
  ),
  numeric(
    'SEED-QA-004',
    'QA',
    'The average of 12, 18, 25, 31 and x is 22. Find x.',
    '24',
    'The required total is 110; the known values total 86.',
  ),
  mcq(
    'SEED-QA-005',
    'QA',
    'A train travels 180 km in 2.5 hours. What is its average speed?',
    ['64 km/h', '68 km/h', '72 km/h', '75 km/h'],
    2,
    'Average speed is 180 ÷ 2.5 = 72 km/h.',
  ),
  numeric(
    'SEED-QA-006',
    'QA',
    'If 3x − 7 = 20, enter the value of x.',
    '9',
    'Adding 7 gives 3x = 27, so x = 9.',
  ),
  mcq(
    'SEED-QA-007',
    'QA',
    'Which number is divisible by both 9 and 11?',
    ['108', '198', '234', '297'],
    1,
    '198 is 18 × 11 and its digits sum to 18, so it is divisible by 9.',
  ),
  mcq(
    'SEED-VA-001',
    'VA',
    'Choose the word closest in meaning to “pragmatic”.',
    ['Idealistic', 'Practical', 'Careless', 'Uncertain'],
    1,
    'Pragmatic means dealing with problems in a practical way.',
  ),
  oneWord(
    'SEED-VA-002',
    'VA',
    'Give one word for a person who compiles a dictionary.',
    'lexicographer',
    'A lexicographer writes or compiles dictionaries.',
  ),
  mcq(
    'SEED-VA-003',
    'VA',
    'Choose the grammatically correct sentence.',
    [
      'Neither of the answers are correct.',
      'Neither of the answers is correct.',
      'Neither answers is correct.',
      'Neither of answer are correct.',
    ],
    1,
    'Neither is singular here and takes “is”.',
  ),
  mcq(
    'SEED-VA-004',
    'VA',
    'In reading comprehension, an inference is best described as:',
    [
      'A direct quotation',
      'A conclusion supported by clues',
      'The passage title',
      'An unrelated opinion',
    ],
    2,
    'An inference follows from evidence even when it is not explicitly stated.',
  ),
  oneWord(
    'SEED-VA-005',
    'VA',
    'Complete with one word: The committee arrived ___ a unanimous decision.',
    'at',
    'The standard collocation is “arrive at a decision”.',
  ),
  mcq(
    'SEED-LR-001',
    'LR',
    'Complete the series: 3, 8, 15, 24, 35, __.',
    ['44', '46', '48', '50'],
    2,
    'Successive differences are 5, 7, 9, 11, then 13; 35 + 13 = 48.',
  ),
  mcq(
    'SEED-LR-002',
    'LR',
    'All poets are dreamers. Some dreamers are scientists. Which conclusion must follow?',
    [
      'All scientists are poets',
      'Some poets are scientists',
      'All poets are dreamers',
      'No dreamer is a poet',
    ],
    1,
    'Only the original universal statement must follow.',
  ),
  oneWord(
    'SEED-LR-003',
    'LR',
    'If SOUTH is coded as TPVUI, write the code for NORTH.',
    'OPSUI',
    'Every letter is shifted one position forward in the alphabet.',
  ),
  mcq(
    'SEED-LR-004',
    'LR',
    'A is left of B, and C is right of B. Who is in the middle?',
    ['A', 'B', 'C', 'Cannot be determined'],
    1,
    'The order is A, B, C; therefore B is in the middle.',
  ),
  numeric(
    'SEED-LR-005',
    'LR',
    'In a row of 12 students, Mira is 5th from the left. What is her rank from the right?',
    '8',
    'Right rank = 12 − 5 + 1 = 8.',
  ),
];

type SectionSeed = {
  code: string;
  name: string;
  subject: 'QA' | 'VA' | 'LR';
  minutes: number;
  questionCodes: string[];
};
type ExamSeed = {
  code: (typeof seedExamCodes)[number];
  title: string;
  description: string;
  courseCode: 'QA' | 'VA' | 'LR' | 'MT';
  minutes: number;
  attempts: number;
  sections: SectionSeed[];
};

const exams: ExamSeed[] = [
  {
    code: 'SEED-QA-PRACTICE',
    title: 'Number Systems & Arithmetic Practice Test',
    description:
      'A focused topic practice test covering remainders, ratios, percentages and averages.',
    courseCode: 'QA',
    minutes: 20,
    attempts: 3,
    sections: [
      section('QUANT-PRACTICE', 'Quantitative Practice', 'QA', 20, [
        'SEED-QA-001',
        'SEED-QA-002',
        'SEED-QA-003',
        'SEED-QA-004',
        'SEED-QA-007',
      ]),
    ],
  },
  {
    code: 'SEED-LR-SECTIONAL',
    title: 'Logical Reasoning Sectional Test',
    description:
      'A timed logical reasoning assessment covering series, deduction, coding and arrangements.',
    courseCode: 'LR',
    minutes: 35,
    attempts: 2,
    sections: [
      section('REASONING-SECTIONAL', 'Logical Reasoning', 'LR', 35, [
        'SEED-LR-001',
        'SEED-LR-002',
        'SEED-LR-003',
        'SEED-LR-004',
        'SEED-LR-005',
      ]),
    ],
  },
  {
    code: 'SEED-VERBAL-SECTIONAL',
    title: 'Verbal Ability & Reading Skills Test',
    description:
      'A language sectional test covering vocabulary, grammar and comprehension strategy.',
    courseCode: 'VA',
    minutes: 30,
    attempts: 2,
    sections: [
      section('VERBAL-SECTIONAL', 'Verbal Ability', 'VA', 30, [
        'SEED-VA-001',
        'SEED-VA-002',
        'SEED-VA-003',
        'SEED-VA-004',
        'SEED-VA-005',
      ]),
    ],
  },
  {
    code: 'SEED-MIXED-MOCK',
    title: 'IPMAT Mixed Skills Mock Test',
    description:
      'A balanced mock with quantitative, verbal and logical reasoning sections.',
    courseCode: 'MT',
    minutes: 60,
    attempts: 2,
    sections: [
      section('MIXED-QUANT', 'Quantitative Aptitude', 'QA', 20, [
        'SEED-QA-002',
        'SEED-QA-004',
        'SEED-QA-006',
      ]),
      section('MIXED-VERBAL', 'Verbal Ability', 'VA', 20, [
        'SEED-VA-001',
        'SEED-VA-003',
        'SEED-VA-005',
      ]),
      section('MIXED-REASONING', 'Logical Reasoning', 'LR', 20, [
        'SEED-LR-001',
        'SEED-LR-003',
        'SEED-LR-005',
      ]),
    ],
  },
  {
    code: 'SEED-FULL-MOCK',
    title: 'IPMAT Full-Length Mock Test 01',
    description:
      'A full-length entrance mock with independent section timers and a single attempt.',
    courseCode: 'MT',
    minutes: 90,
    attempts: 1,
    sections: [
      section('FULL-QUANT', 'Quantitative Aptitude', 'QA', 30, [
        'SEED-QA-001',
        'SEED-QA-002',
        'SEED-QA-003',
        'SEED-QA-005',
        'SEED-QA-007',
      ]),
      section('FULL-VERBAL', 'Verbal Ability', 'VA', 30, [
        'SEED-VA-001',
        'SEED-VA-002',
        'SEED-VA-003',
        'SEED-VA-004',
        'SEED-VA-005',
      ]),
      section('FULL-REASONING', 'Logical Reasoning', 'LR', 30, [
        'SEED-LR-001',
        'SEED-LR-002',
        'SEED-LR-003',
        'SEED-LR-004',
        'SEED-LR-005',
      ]),
    ],
  },
];

export async function seedStudentLearningFlow() {
  await seedResourceTypes(prisma);
  await seedQuestionTypes();
  const organization = await prisma.organization.findUnique({
    where: { code: ORG_CODE },
  });
  if (!organization)
    throw new Error(
      `Organization ${ORG_CODE} is missing. Run SEED_DASHBOARD=true npm run seed first.`,
    );
  const session = await prisma.session.findFirst({
    where: {
      organizationId: organization.id,
      code: SESSION_CODE,
      isActive: true,
    },
  });
  if (!session) throw new Error(`Session ${SESSION_CODE} is missing.`);
  const sessionCourses = await prisma.sessionCourse.findMany({
    where: { sessionId: session.id, isActive: true },
    include: { course: true },
  });
  const courseByCode = new Map(
    sessionCourses.map((item) => [item.course.code, item]),
  );
  for (const code of ['QA', 'VA', 'LR', 'MT'])
    if (!courseByCode.has(code))
      throw new Error(`Session course ${code} is missing.`);
  const enrollmentCount = await prisma.studentCourseEnrollment.count({
    where: {
      sessionCourseId: { in: sessionCourses.map(({ id }) => id) },
      isActive: true,
      enrollment: { organizationId: organization.id, isActive: true },
    },
  });
  if (!enrollmentCount)
    throw new Error(
      'No active student enrollment is connected to the target session courses.',
    );

  await seedLmsResources();
  await disconnectLmsResourceSeed();
  const folders = await ensureCanonicalFolders(courseByCode);
  await moveLearningResources(folders);
  await cleanupPreviousExamSeeds(organization.id);
  const subjects = await seedSubjects(organization.id);
  const versions = await seedQuestions(organization.id, subjects);

  for (const [index, examSeed] of exams.entries()) {
    await createExamGraph(
      examSeed,
      index,
      organization.id,
      session.id,
      courseByCode.get(examSeed.courseCode)!.id,
      folders.get(examSeed.courseCode)!,
      subjects,
      versions,
    );
  }

  await cleanupKnownEmptyFolders(session.id, [...folders.values()]);
  const verified = await verify(organization.id);
  console.log('\n========================================');
  console.log('STUDENT LEARNING FLOW SEED COMPLETED');
  console.log('========================================');
  console.log(`Top-level folders: ${verified.folders}`);
  console.log(`Documents:         ${verified.documents}`);
  console.log(`Videos:            ${verified.videos}`);
  console.log(`Exams:             ${verified.exams}`);
  exams.forEach((exam, index) => console.log(`${index + 1}. ${exam.title}`));
  console.log('========================================\n');
  await prisma.$disconnect();
}

async function seedQuestionTypes() {
  const seeds = [
    {
      id: 1,
      code: 'SINGLE_CHOICE',
      name: 'Single Answer',
      description: 'Exactly one option is correct.',
    },
    {
      id: 2,
      code: 'NUMERIC',
      name: 'Numeric Answer',
      description: 'A numeric response with optional tolerance.',
    },
    {
      id: 3,
      code: 'ONE_WORD',
      name: 'One Word Answer',
      description: 'A short accepted text response.',
    },
  ];
  for (const item of seeds)
    await prisma.questionType.upsert({
      where: { id: item.id },
      update: { ...item, isActive: true },
      create: item,
    });
}

async function ensureCanonicalFolders(
  courseByCode: Map<string, { id: number }>,
) {
  const names: Record<string, [string, string, string]> = {
    QA: [
      'Quantitative Aptitude',
      'Practice quantitative concepts, notes and assessments.',
      '#059669',
    ],
    VA: [
      'Verbal Ability',
      'Vocabulary, reading and language practice resources.',
      '#7c3aed',
    ],
    LR: [
      'Logical Reasoning',
      'Reasoning concepts, practice and timed assessments.',
      '#2563eb',
    ],
    MT: [
      'Mock Tests',
      'Mixed-subject and full-length mock assessments.',
      '#ea580c',
    ],
  };
  const result = new Map<string, number>();
  for (const [code, [name, description, color]] of Object.entries(names)) {
    const sessionCourseId = courseByCode.get(code)!.id;
    let folder = await prisma.folder.findFirst({
      where: { sessionCourseId, parentFolderId: null, name },
    });
    folder = folder
      ? await prisma.folder.update({
          where: { id: folder.id },
          data: {
            description,
            color,
            icon: 'folder',
            isActive: true,
            status: FolderStatus.ACTIVE,
          },
        })
      : await prisma.folder.create({
          data: {
            sessionCourseId,
            parentFolderId: null,
            name,
            description,
            color,
            icon: 'folder',
            sortOrder: 1,
          },
        });
    result.set(code, folder.id);
  }
  return result;
}

async function moveLearningResources(folders: Map<string, number>) {
  const mapping = [
    ['5eed0000-0001-4000-8000-000000000001', 'QA'],
    ['5eed0000-0002-4000-8000-000000000002', 'VA'],
    ['5eed0000-0003-4000-8000-000000000003', 'LR'],
    ['5eed0000-0004-4000-8000-000000000004', 'MT'],
    ['5eed0000-0005-4000-8000-000000000005', 'MT'],
    ['5eed0000-0006-4000-8000-000000000006', 'QA'],
    ['5eed0000-0007-4000-8000-000000000007', 'QA'],
    ['5eed0000-0008-4000-8000-000000000008', 'VA'],
    ['5eed0000-0009-4000-8000-000000000009', 'LR'],
    ['5eed0000-0010-4000-8000-000000000010', 'MT'],
  ] as const;
  for (const [uuid, code] of mapping)
    await prisma.resource.update({
      where: { uuid },
      data: { folderId: folders.get(code)! },
    });
}

async function cleanupPreviousExamSeeds(organizationId: number) {
  const previousCodes = [...seedExamCodes, 'SEED-QA-SECTIONAL'];
  await prisma.resource.deleteMany({
    where: {
      OR: [
        { uuid: { in: examResourceUuids } },
        { exam: { organizationId, code: { in: previousCodes } } },
      ],
    },
  });
  await prisma.exam.deleteMany({
    where: {
      organizationId,
      code: { in: previousCodes },
      attempts: { none: {} },
    },
  });
  await prisma.examTemplate.deleteMany({
    where: {
      organizationId,
      code: { in: previousCodes.map((code) => `TPL-${code}`) },
      versions: { every: { exams: { none: { attempts: { some: {} } } } } },
    },
  });
  const legacy = await prisma.exam.findFirst({
    where: { organizationId, code: 'CUET-MOCK-01', attempts: { none: {} } },
  });
  if (legacy) {
    await prisma.resource.deleteMany({ where: { examId: legacy.id } });
    await prisma.exam.delete({ where: { id: legacy.id } });
  }
  await prisma.examTemplate.deleteMany({
    where: {
      organizationId,
      code: 'CUET-DEMO',
      versions: { every: { exams: { none: {} } } },
    },
  });
}

async function seedSubjects(organizationId: number) {
  const data = {
    QA: ['MATHEMATICS', 'Quantitative Aptitude'],
    VA: ['ENGLISH', 'English Language'],
    LR: ['REASONING', 'Logical Reasoning'],
  } as const;
  const result = new Map<string, number>();
  for (const [key, [code, name]] of Object.entries(data)) {
    const subject = await prisma.subject.upsert({
      where: { organizationId_code: { organizationId, code } },
      update: { name, isActive: true },
      create: {
        organizationId,
        code,
        name,
        description: `${name} question bank.`,
      },
    });
    result.set(key, subject.id);
  }
  return result;
}

async function seedQuestions(
  organizationId: number,
  subjects: Map<string, number>,
) {
  const result = new Map<string, number>();
  for (const seed of questions) {
    const question = await prisma.question.upsert({
      where: { organizationId_code: { organizationId, code: seed.code } },
      update: {
        subjectId: subjects.get(seed.subject)!,
        status: QuestionStatus.PUBLISHED,
        isActive: true,
      },
      create: {
        organizationId,
        subjectId: subjects.get(seed.subject)!,
        code: seed.code,
        status: QuestionStatus.PUBLISHED,
      },
    });
    let version = await prisma.questionVersion.findUnique({
      where: {
        questionId_versionNumber: { questionId: question.id, versionNumber: 1 },
      },
    });
    if (version) {
      await prisma.questionOption.deleteMany({
        where: { questionVersionId: version.id },
      });
      await prisma.questionAcceptedAnswer.deleteMany({
        where: { questionVersionId: version.id },
      });
      version = await prisma.questionVersion.update({
        where: { id: version.id },
        data: {
          questionTypeId: questionTypes[seed.type],
          content: seed.content,
          explanation: seed.explanation,
          defaultMarks: seed.marks,
          defaultNegativeMarks: seed.negativeMarks,
          caseSensitive: false,
          normalizeWhitespace: true,
          isPublished: true,
        },
      });
    } else {
      version = await prisma.questionVersion.create({
        data: {
          questionId: question.id,
          questionTypeId: questionTypes[seed.type],
          versionNumber: 1,
          content: seed.content,
          explanation: seed.explanation,
          defaultMarks: seed.marks,
          defaultNegativeMarks: seed.negativeMarks,
          isPublished: true,
        },
      });
    }
    if (seed.options)
      await prisma.questionOption.createMany({
        data: seed.options.map(([code, content], sortOrder) => ({
          questionVersionId: version.id,
          code,
          content,
          isCorrect: code === seed.answer,
          sortOrder,
        })),
      });
    else
      await prisma.questionAcceptedAnswer.create({
        data: {
          questionVersionId: version.id,
          textValue: seed.type === 'ONE_WORD' ? seed.answer : null,
          normalizedText:
            seed.type === 'ONE_WORD' ? seed.answer.toLowerCase() : null,
          numericValue: seed.type === 'NUMERIC' ? seed.answer : null,
          numericTolerance: seed.type === 'NUMERIC' ? 0 : null,
          isPrimary: true,
        },
      });
    result.set(seed.code, version.id);
  }
  return result;
}

async function createExamGraph(
  seed: ExamSeed,
  index: number,
  organizationId: number,
  sessionId: number,
  sessionCourseId: number,
  folderId: number,
  subjects: Map<string, number>,
  versions: Map<string, number>,
) {
  const template = await prisma.examTemplate.create({
    data: {
      organizationId,
      code: `TPL-${seed.code}`,
      name: `${seed.title} Template`,
      description: seed.description,
      status: ExamTemplateStatus.PUBLISHED,
    },
  });
  const version = await prisma.examTemplateVersion.create({
    data: {
      examTemplateId: template.id,
      versionNumber: 1,
      instructions:
        'Complete every section within its time limit. Review answers before submitting.',
      defaultDurationMinutes: seed.minutes,
      status: ExamTemplateVersionStatus.PUBLISHED,
      publishedAt: new Date('2026-08-21T00:00:00.000Z'),
    },
  });
  const slot = await prisma.examTemplateSlot.create({
    data: {
      examTemplateVersionId: version.id,
      code: `${seed.code}-SLOT-1`,
      name: 'Primary Slot',
      description: 'Main scheduled attempt slot.',
      instructions: 'Section timers run independently.',
      durationMinutes: seed.minutes,
      navigationMode: ExamNavigationMode.FREE,
      sortOrder: 1,
    },
  });
  for (const [sectionIndex, item] of seed.sections.entries()) {
    const examSection = await prisma.examTemplateSection.create({
      data: {
        examTemplateSlotId: slot.id,
        code: item.code,
        name: item.name,
        instructions: `Answer all ${item.questionCodes.length} questions.`,
        durationMinutes: item.minutes,
        questionsToAttempt: item.questionCodes.length,
        randomizeQuestions: index >= 3,
        randomizeOptions: true,
        sortOrder: sectionIndex + 1,
      },
    });
    const sectionSubject = await prisma.examTemplateSectionSubject.create({
      data: {
        examTemplateSectionId: examSection.id,
        subjectId: subjects.get(item.subject)!,
        sortOrder: 1,
      },
    });
    await prisma.examTemplateQuestion.createMany({
      data: item.questionCodes.map((code, questionIndex) => {
        const question = questions.find(
          (candidate) => candidate.code === code,
        )!;
        return {
          examTemplateSectionSubjectId: sectionSubject.id,
          questionVersionId: versions.get(code)!,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          sortOrder: questionIndex + 1,
        };
      }),
    });
  }
  const exam = await prisma.exam.create({
    data: {
      organizationId,
      sessionId,
      examTemplateVersionId: version.id,
      code: seed.code,
      title: seed.title,
      instructions: seed.description,
      availableFrom: new Date('2026-08-01T00:00:00.000Z'),
      availableUntil: new Date('2027-12-31T23:59:59.000Z'),
      durationMinutes: seed.minutes,
      attemptLimit: seed.attempts,
      status: ExamStatus.SCHEDULED,
      selectedSlots: { create: { examTemplateSlotId: slot.id, sortOrder: 1 } },
      courseAssignments: { create: { sessionCourseId } },
    },
  });
  await prisma.resource.create({
    data: {
      uuid: examResourceUuids[index],
      folderId,
      resourceTypeId: RESOURCE_TYPE_IDS.EXAM,
      examId: exam.id,
      title: seed.title,
      description: seed.description,
      sortOrder: 100 + index,
      status: ResourceStatus.PUBLISHED,
      isPublished: true,
      isDownloadable: false,
      isActive: true,
    },
  });
}

async function cleanupKnownEmptyFolders(sessionId: number, keepIds: number[]) {
  const names = [
    'Quantitative Aptitude Resources',
    'Aptitude Notes',
    'Verbal Ability Resources',
    'Verbal Lessons',
    'Logical Reasoning Resources',
    'Reasoning Practice',
    'Mock Tests Resources',
    'Mock Test Assignments',
  ];
  const candidates = await prisma.folder.findMany({
    where: {
      sessionCourse: { sessionId },
      parentFolderId: null,
      id: { notIn: keepIds },
      name: { in: names },
      children: { none: {} },
    },
    select: { id: true },
  });
  if (candidates.length) {
    const candidateIds = candidates.map(({ id }) => id);
    await prisma.resource.deleteMany({
      where: { folderId: { in: candidateIds } },
    });
    await prisma.folder.deleteMany({
      where: { id: { in: candidateIds } },
    });
  }
}

async function verify(organizationId: number) {
  const resources = await prisma.resource.findMany({
    where: {
      OR: [
        { uuid: { in: [...examResourceUuids] } },
        { uuid: { in: learningResourceUuids } },
      ],
    },
    include: {
      folder: { include: { sessionCourse: { include: { session: true } } } },
      exam: {
        include: {
          courseAssignments: true,
          selectedSlots: {
            include: {
              templateSlot: {
                include: {
                  sections: {
                    include: { subjects: { include: { questions: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  for (const resource of resources) {
    if (
      resource.folder.parentFolderId ||
      resource.folder.sessionCourse.session.organizationId !== organizationId
    )
      throw new Error(`Invalid folder/tenant relation for ${resource.title}`);
    if (
      resource.resourceTypeId === RESOURCE_TYPE_IDS.EXAM &&
      (!resource.exam ||
        !resource.exam.courseAssignments.some(
          ({ sessionCourseId }) =>
            sessionCourseId === resource.folder.sessionCourseId,
        ))
    )
      throw new Error(`Invalid exam assignment for ${resource.title}`);
  }
  const examResources = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.EXAM,
  );
  if (
    examResources.length !== 5 ||
    examResources.some(({ exam }) => !exam?.selectedSlots.length)
  )
    throw new Error('Expected five complete seeded exams.');
  return {
    folders: new Set(resources.map(({ folderId }) => folderId)).size,
    documents: resources.filter(
      ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT,
    ).length,
    videos: resources.filter(
      ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.VIDEO,
    ).length,
    exams: examResources.length,
  };
}

function section(
  code: string,
  name: string,
  subject: SectionSeed['subject'],
  minutes: number,
  questionCodes: string[],
): SectionSeed {
  return { code, name, subject, minutes, questionCodes };
}
function mcq(
  code: string,
  subject: SeedQuestion['subject'],
  content: string,
  labels: string[],
  answerIndex: number,
  explanation: string,
): SeedQuestion {
  return {
    code,
    subject,
    type: 'SINGLE_CHOICE',
    content,
    explanation,
    answer: ['A', 'B', 'C', 'D'][answerIndex],
    options: labels.map((label, index) => [['A', 'B', 'C', 'D'][index], label]),
    marks: 4,
    negativeMarks: 1,
  };
}
function numeric(
  code: string,
  subject: SeedQuestion['subject'],
  content: string,
  answer: string,
  explanation: string,
): SeedQuestion {
  return {
    code,
    subject,
    type: 'NUMERIC',
    content,
    explanation,
    answer,
    marks: 5,
    negativeMarks: 0,
  };
}
function oneWord(
  code: string,
  subject: SeedQuestion['subject'],
  content: string,
  answer: string,
  explanation: string,
): SeedQuestion {
  return {
    code,
    subject,
    type: 'ONE_WORD',
    content,
    explanation,
    answer,
    marks: 3,
    negativeMarks: 0,
  };
}

if (require.main === module) {
  seedStudentLearningFlow()
    .catch((error: unknown) => {
      console.error('Student learning flow seed failed', error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
