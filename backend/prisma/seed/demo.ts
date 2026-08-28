import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import {
  CourseStatus,
  ExamNavigationMode,
  ExamResultReleaseMode,
  ExamStatus,
  ExamTemplateStatus,
  ExamTemplateVersionStatus,
  ExamVirtualKeyboardMode,
  FolderStatus,
  OrganizationStatus,
  PrismaClient,
  QuestionStatus,
  RegistrationPageStatus,
  ResourceStatus,
  SessionCourseStatus,
  SessionStatus,
  StudentCourseEnrollmentStatus,
  StudentEnrollmentStatus,
  StudentStatus,
  UserStatus,
} from '@prisma/client';

import { PasswordService } from '../../src/modules/auth/services/password.service';
import { QUESTION_TYPE_IDS } from '../../src/modules/exam/constants/question-type.constants';
import { RESOURCE_TYPE_IDS } from '../../src/modules/resource/constants/resource-type.constants';
import { seedResourceTypes } from './resource-types';
import { ensureOrganizationActivityPolicies } from './activity-policies';
import { seedDemoActivityHistory } from './demo-activity-history';

const prisma = new PrismaClient();
const DEMO_ORG_CODE = 'LMS-DEMO';
const DEMO_SESSION_CODE = 'AY-2026-27';
const DEMO_COURSE_CODE = 'COMP-EXAM-DEMO';
const DEMO_REGISTRATION_SLUG = 'lms-demo';
const DEMO_EXAM_CODE = 'DEMO-FOUNDATION-CHECK';
const DEMO_EXAM_RESOURCE_UUID = '10000000-0000-4000-8000-000000000301';

const credentials = {
  admin: {
    email: 'admin@lmsdemo.example.com',
    password: 'DemoAdmin@2026!',
  },
  teacher: {
    email: 'teacher@lmsdemo.example.com',
    password: 'DemoTeacher@2026!',
  },
  counselor: {
    email: 'counselor@lmsdemo.example.com',
    password: 'DemoCounselor@2026!',
  },
  student: {
    email: 'student@lmsdemo.example.com',
    password: 'DemoStudent@2026!',
  },
} as const;

const permissionModules = [
  'organizations',
  'users',
  'students',
  'roles',
  'permissions',
  'session',
  'course',
  'session-course',
  'folder',
  'resource',
  'dashboard',
  'subject',
  'question',
  'exam-template',
  'exam',
  'exam-import',
] as const;
const crudActions = ['create', 'read', 'update', 'delete'] as const;
const allPermissionKeys = permissionModules.flatMap((module) =>
  crudActions.map((action) => `${module}.${action}`),
);

const passwordService = new PasswordService({
  get: (key: string) =>
    key === 'bcrypt.saltRounds'
      ? Number(process.env.BCRYPT_SALT_ROUNDS ?? 12)
      : undefined,
} as ConfigService);

async function main() {
  console.log('Preparing LMS client demo seed');
  await seedSystemReferenceData();
  const rolesByCode = await seedRolesAndPermissions();
  const organization = await seedOrganization();
  await ensureOrganizationActivityPolicies(prisma);
  const users = await seedUsers(organization.id, rolesByCode);
  const session = await seedSession(organization.id);
  const course = await seedCourse();
  const sessionCourse = await seedSessionCourse(session.id, course.id);
  await seedCourseInstructor(sessionCourse.id, users.teacher.id);
  const folders = await seedFolders(sessionCourse.id);
  const exam = await seedExamResource(
    organization.id,
    session.id,
    sessionCourse.id,
    folders.assessment.id,
  );
  await seedLearningResources(folders.gettingStarted.id, folders.study.id);
  await seedStudentEnrollment(
    users.student.id,
    organization.id,
    session.id,
    sessionCourse.id,
    folders.gettingStarted.id,
  );
  const activityHistory = await seedDemoActivityHistory(prisma, {
    organizationId: organization.id,
    studentId: users.student.id,
    studentUserId: users.student.userId,
    studentEmail: credentials.student.email,
    adminUserId: users.admin.id,
    counselorUserId: users.counselor.id,
    sessionCourseId: sessionCourse.id,
    examId: exam.id,
  });
  const educationOptions = await seedEducationOptions(organization.id);
  const libraryLocations = await seedDigitalLibraryLocations(organization.id);
  await seedRegistrationPage(
    organization.id,
    session.id,
    sessionCourse.id,
    educationOptions.map(({ id }) => id),
    libraryLocations.map(({ id }) => id),
  );

  console.log('\nDemo seed completed');
  console.log(`Organization: ${DEMO_ORG_CODE}`);
  console.log(`Session: ${DEMO_SESSION_CODE}`);
  console.log(`Course: ${DEMO_COURSE_CODE}`);
  console.log(`Exam: ${exam.code}`);
  console.log(`Registration: /register/${DEMO_REGISTRATION_SLUG}`);
  console.log(`Admin report: /admin/students/${users.student.uuid}/activity`);
  console.log(
    `Teacher report: /teacher/students/${users.student.uuid}/activity`,
  );
  console.log('Activity history:', activityHistory);
  console.log('\nDemo credentials');
  console.table(credentials);
}

async function seedSystemReferenceData() {
  await seedResourceTypes(prisma);
  const questionTypes = [
    {
      id: QUESTION_TYPE_IDS.SINGLE_CHOICE,
      code: 'SINGLE_CHOICE',
      name: 'Single Answer',
      description: 'Exactly one option is correct.',
    },
    {
      id: QUESTION_TYPE_IDS.NUMERIC,
      code: 'NUMERIC',
      name: 'Numeric Answer',
      description: 'A numeric response with optional tolerance.',
    },
    {
      id: QUESTION_TYPE_IDS.ONE_WORD,
      code: 'ONE_WORD',
      name: 'One Word Answer',
      description: 'A short accepted text response.',
    },
  ];

  for (const questionType of questionTypes) {
    await prisma.questionType.upsert({
      where: { id: questionType.id },
      update: { ...questionType, isActive: true },
      create: { ...questionType, isActive: true },
    });
  }
}

async function seedRolesAndPermissions() {
  const permissions = new Map<string, number>();
  for (const key of allPermissionKeys) {
    const [module, action] = key.split('.');
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {
        module,
        action,
        description: `Allows ${action} access for ${module}`,
      },
      create: {
        module,
        action,
        key,
        description: `Allows ${action} access for ${module}`,
      },
    });
    permissions.set(key, permission.id);
  }

  const roleSeeds = [
    ['ADMIN', 'Admin', 'Organization administrator'],
    ['STUDENT', 'Student', 'Learner access'],
    ['TEACHER', 'Teacher', 'Instructor access'],
    ['COUNSELOR', 'Counselor', 'Counselor access'],
  ] as const;
  const rolesByCode = new Map<string, { id: number }>();

  for (const [code, name, description] of roleSeeds) {
    const role = await prisma.role.upsert({
      where: { scope_code: { scope: 'GLOBAL', code } },
      update: {
        name,
        description,
        organizationId: null,
        isSystem: true,
        isActive: true,
      },
      create: {
        scope: 'GLOBAL',
        code,
        name,
        description,
        organizationId: null,
        isSystem: true,
        isActive: true,
      },
    });
    rolesByCode.set(code, { id: role.id });
  }

  await replaceRolePermissions(
    rolesByCode.get('ADMIN')!.id,
    [...allPermissionKeys],
    permissions,
  );
  await replaceRolePermissions(
    rolesByCode.get('TEACHER')!.id,
    allPermissionKeys.filter((key) => key.endsWith('.read')),
    permissions,
  );
  await replaceRolePermissions(
    rolesByCode.get('COUNSELOR')!.id,
    [
      'dashboard.read',
      'students.read',
      'session.read',
      'course.read',
      'session-course.read',
      'folder.read',
      'resource.read',
      'exam.read',
    ],
    permissions,
  );
  await replaceRolePermissions(rolesByCode.get('STUDENT')!.id, [], permissions);

  return rolesByCode;
}

async function replaceRolePermissions(
  roleId: number,
  keys: string[],
  permissions: Map<string, number>,
) {
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  const permissionIds = keys
    .map((key) => permissions.get(key))
    .filter((id): id is number => id !== undefined);
  if (!permissionIds.length) return;
  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    skipDuplicates: true,
  });
}

async function seedOrganization() {
  return prisma.organization.upsert({
    where: { code: DEMO_ORG_CODE },
    update: {
      name: 'LMS Demo Organization',
      description: 'Clean client demo organization for LMS walkthroughs.',
      logo: null,
      website: 'https://lmsdemo.example.com',
      email: 'contact@lmsdemo.example.com',
      phone: '+1-555-0100',
      address: '100 Demo Learning Avenue, Suite 1',
      status: OrganizationStatus.ACTIVE,
      isActive: true,
    },
    create: {
      name: 'LMS Demo Organization',
      code: DEMO_ORG_CODE,
      description: 'Clean client demo organization for LMS walkthroughs.',
      logo: null,
      website: 'https://lmsdemo.example.com',
      email: 'contact@lmsdemo.example.com',
      phone: '+1-555-0100',
      address: '100 Demo Learning Avenue, Suite 1',
      status: OrganizationStatus.ACTIVE,
      isActive: true,
    },
  });
}

async function seedUsers(
  organizationId: number,
  rolesByCode: Map<string, { id: number }>,
) {
  const [admin, teacher, counselor, student] = await Promise.all([
    upsertUser(
      organizationId,
      credentials.admin.email,
      credentials.admin.password,
      'Aarav',
      'Admin',
      '+1-555-0101',
    ),
    upsertUser(
      organizationId,
      credentials.teacher.email,
      credentials.teacher.password,
      'Tara',
      'Teacher',
      '+1-555-0102',
    ),
    upsertUser(
      organizationId,
      credentials.counselor.email,
      credentials.counselor.password,
      'Carmen',
      'Counselor',
      '+1-555-0103',
    ),
    upsertUser(
      organizationId,
      credentials.student.email,
      credentials.student.password,
      'Sam',
      'Student',
      '+1-555-0104',
    ),
  ]);

  await Promise.all([
    assignRole(admin.id, rolesByCode.get('ADMIN')!.id, organizationId),
    assignRole(teacher.id, rolesByCode.get('TEACHER')!.id, organizationId),
    assignRole(counselor.id, rolesByCode.get('COUNSELOR')!.id, organizationId),
    assignRole(student.id, rolesByCode.get('STUDENT')!.id, organizationId),
  ]);

  const studentRecord = await prisma.student.upsert({
    where: { userId: student.id },
    update: {
      organizationId,
      studentCode: 'LMS-DEMO-STUDENT-001',
      admissionNumber: 'LMS-DEMO-ADM-001',
      rollNumber: 'DEMO-001',
      status: StudentStatus.ACTIVE,
      isActive: true,
    },
    create: {
      userId: student.id,
      organizationId,
      studentCode: 'LMS-DEMO-STUDENT-001',
      admissionNumber: 'LMS-DEMO-ADM-001',
      rollNumber: 'DEMO-001',
      status: StudentStatus.ACTIVE,
      isActive: true,
    },
  });

  await prisma.studentProfile.upsert({
    where: { studentId: studentRecord.id },
    update: {
      firstName: 'Sam',
      lastName: 'Student',
      gender: 'OTHER',
      phone: '+1-555-0104',
      city: 'Demo City',
      state: 'Demo State',
    },
    create: {
      studentId: studentRecord.id,
      firstName: 'Sam',
      lastName: 'Student',
      gender: 'OTHER',
      phone: '+1-555-0104',
      city: 'Demo City',
      state: 'Demo State',
    },
  });

  return { admin, teacher, counselor, student: studentRecord };
}

async function upsertUser(
  organizationId: number,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string,
) {
  const hashedPassword = await passwordService.hash(password);
  return prisma.user.upsert({
    where: { email },
    update: {
      organizationId,
      firstName,
      lastName,
      password: hashedPassword,
      phone,
      status: UserStatus.ACTIVE,
      isActive: true,
      isVerified: true,
    },
    create: {
      organizationId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      status: UserStatus.ACTIVE,
      isActive: true,
      isVerified: true,
    },
  });
}

async function assignRole(
  userId: number,
  roleId: number,
  organizationId: number,
) {
  await prisma.userRole.upsert({
    where: {
      userId_roleId_organizationId: { userId, roleId, organizationId },
    },
    update: { isActive: true },
    create: { userId, roleId, organizationId, isActive: true },
  });
}

async function seedSession(organizationId: number) {
  return prisma.session.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: 'Academic Session 2026-27',
      },
    },
    update: {
      code: DEMO_SESSION_CODE,
      description: 'Single active academic session for the client demo.',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.000Z'),
      status: SessionStatus.ACTIVE,
      isActive: true,
    },
    create: {
      organizationId,
      name: 'Academic Session 2026-27',
      code: DEMO_SESSION_CODE,
      description: 'Single active academic session for the client demo.',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.000Z'),
      status: SessionStatus.ACTIVE,
      isActive: true,
    },
  });
}

async function seedCourse() {
  return prisma.course.upsert({
    where: { code: DEMO_COURSE_CODE },
    update: {
      name: 'Competitive Exam Preparation',
      description:
        'A concise demo course covering lessons, resources, and assessment.',
      thumbnail: null,
      durationInDays: 180,
      status: CourseStatus.ACTIVE,
      isActive: true,
    },
    create: {
      name: 'Competitive Exam Preparation',
      code: DEMO_COURSE_CODE,
      description:
        'A concise demo course covering lessons, resources, and assessment.',
      durationInDays: 180,
      status: CourseStatus.ACTIVE,
      isActive: true,
    },
  });
}

async function seedSessionCourse(sessionId: number, courseId: number) {
  return prisma.sessionCourse.upsert({
    where: { sessionId_courseId: { sessionId, courseId } },
    update: {
      displayName: 'Competitive Exam Preparation',
      description: 'Published demo session course for student enrollment.',
      sortOrder: 1,
      isPublished: true,
      status: SessionCourseStatus.ACTIVE,
      isActive: true,
    },
    create: {
      sessionId,
      courseId,
      displayName: 'Competitive Exam Preparation',
      description: 'Published demo session course for student enrollment.',
      sortOrder: 1,
      isPublished: true,
      status: SessionCourseStatus.ACTIVE,
      isActive: true,
    },
  });
}

async function seedCourseInstructor(
  sessionCourseId: number,
  instructorId: number,
) {
  await prisma.courseInstructor.upsert({
    where: {
      sessionCourseId_instructorId: { sessionCourseId, instructorId },
    },
    update: {},
    create: { sessionCourseId, instructorId },
  });
}

async function seedFolders(sessionCourseId: number) {
  const gettingStarted = await upsertFolder(
    sessionCourseId,
    'Getting Started',
    'Orientation and introductory learning resources.',
    1,
    '#059669',
  );
  const study = await upsertFolder(
    sessionCourseId,
    'Study Material',
    'Core demo notes and guided material.',
    2,
    '#2563eb',
  );
  const assessment = await upsertFolder(
    sessionCourseId,
    'Assessment',
    'Small demo assessment for the course.',
    3,
    '#ea580c',
  );
  return { gettingStarted, study, assessment };
}

async function upsertFolder(
  sessionCourseId: number,
  name: string,
  description: string,
  sortOrder: number,
  color: string,
) {
  const existing = await prisma.folder.findFirst({
    where: { sessionCourseId, parentFolderId: null, name },
  });
  if (existing) {
    return prisma.folder.update({
      where: { id: existing.id },
      data: {
        description,
        sortOrder,
        color,
        icon: 'folder',
        status: FolderStatus.ACTIVE,
        isActive: true,
      },
    });
  }
  return prisma.folder.create({
    data: {
      sessionCourseId,
      parentFolderId: null,
      name,
      description,
      sortOrder,
      color,
      icon: 'folder',
      status: FolderStatus.ACTIVE,
      isActive: true,
    },
  });
}

async function seedLearningResources(
  gettingStartedFolderId: number,
  studyFolderId: number,
) {
  await prisma.resource.upsert({
    where: { uuid: '10000000-0000-4000-8000-000000000101' },
    update: {
      folderId: gettingStartedFolderId,
      title: 'Welcome Guide PDF',
      description: 'A short PDF used to demonstrate document resources.',
      resourceTypeId: RESOURCE_TYPE_IDS.DOCUMENT,
      documentUrl:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      videoUrl: null,
      examId: null,
      mimeType: 'application/pdf',
      fileSize: BigInt(13264),
      durationInSeconds: null,
      sortOrder: 1,
      status: ResourceStatus.PUBLISHED,
      isPublished: true,
      isDownloadable: true,
      isActive: true,
    },
    create: {
      uuid: '10000000-0000-4000-8000-000000000101',
      folderId: gettingStartedFolderId,
      title: 'Welcome Guide PDF',
      description: 'A short PDF used to demonstrate document resources.',
      resourceTypeId: RESOURCE_TYPE_IDS.DOCUMENT,
      documentUrl:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      mimeType: 'application/pdf',
      fileSize: BigInt(13264),
      sortOrder: 1,
      status: ResourceStatus.PUBLISHED,
      isPublished: true,
      isDownloadable: true,
      isActive: true,
    },
  });

  await prisma.resource.upsert({
    where: { uuid: '10000000-0000-4000-8000-000000000102' },
    update: {
      folderId: studyFolderId,
      title: 'Demo Strategy Video',
      description: 'Externally hosted video resource for the demo course.',
      resourceTypeId: RESOURCE_TYPE_IDS.VIDEO,
      documentUrl: null,
      videoUrl: 'https://vimeo.com/76979871',
      examId: null,
      thumbnail: null,
      mimeType: 'video/mp4',
      fileSize: null,
      durationInSeconds: 55,
      sortOrder: 1,
      status: ResourceStatus.PUBLISHED,
      isPublished: true,
      isDownloadable: false,
      isActive: true,
    },
    create: {
      uuid: '10000000-0000-4000-8000-000000000102',
      folderId: studyFolderId,
      title: 'Demo Strategy Video',
      description: 'Externally hosted video resource for the demo course.',
      resourceTypeId: RESOURCE_TYPE_IDS.VIDEO,
      videoUrl: 'https://vimeo.com/76979871',
      mimeType: 'video/mp4',
      durationInSeconds: 55,
      sortOrder: 1,
      status: ResourceStatus.PUBLISHED,
      isPublished: true,
      isDownloadable: false,
      isActive: true,
    },
  });
}

async function seedExamResource(
  organizationId: number,
  sessionId: number,
  sessionCourseId: number,
  folderId: number,
) {
  await cleanupDemoExam(organizationId);
  const subject = await prisma.subject.upsert({
    where: { organizationId_code: { organizationId, code: 'DEMO-APTITUDE' } },
    update: {
      name: 'Demo Aptitude',
      description: 'Small question bank for the client demo.',
      isActive: true,
    },
    create: {
      organizationId,
      code: 'DEMO-APTITUDE',
      name: 'Demo Aptitude',
      description: 'Small question bank for the client demo.',
      isActive: true,
    },
  });
  const questionVersionIds = await seedDemoQuestions(
    organizationId,
    subject.id,
  );

  const template = await prisma.examTemplate.create({
    data: {
      organizationId,
      code: `TPL-${DEMO_EXAM_CODE}`,
      name: 'Demo Foundation Check Template',
      description: 'Minimal valid published template for the demo exam.',
      status: ExamTemplateStatus.PUBLISHED,
      isActive: true,
    },
  });
  const templateVersion = await prisma.examTemplateVersion.create({
    data: {
      examTemplateId: template.id,
      versionNumber: 1,
      instructions: 'Answer all questions and submit the assessment.',
      defaultDurationMinutes: 15,
      enforceSlotTimers: false,
      enforceSectionTimers: false,
      status: ExamTemplateVersionStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });
  const slot = await prisma.examTemplateSlot.create({
    data: {
      examTemplateVersionId: templateVersion.id,
      code: 'DEMO-SLOT-1',
      name: 'Demo Slot',
      description: 'Primary demo exam slot.',
      instructions: 'Complete the section within 15 minutes.',
      durationMinutes: 15,
      navigationMode: ExamNavigationMode.FREE,
      autoSubmitOnTimeout: true,
      sortOrder: 1,
      isActive: true,
    },
  });
  const section = await prisma.examTemplateSection.create({
    data: {
      examTemplateSlotId: slot.id,
      code: 'DEMO-SECTION-1',
      name: 'Demo Aptitude Section',
      instructions: 'Attempt all demo questions.',
      durationMinutes: 15,
      questionsToAttempt: questionVersionIds.length,
      randomizeQuestions: false,
      randomizeOptions: false,
      navigationMode: ExamNavigationMode.FREE,
      allowReview: true,
      autoSubmitOnTimeout: true,
      sortOrder: 1,
      isActive: true,
    },
  });
  const sectionSubject = await prisma.examTemplateSectionSubject.create({
    data: {
      examTemplateSectionId: section.id,
      subjectId: subject.id,
      isMandatory: true,
      sortOrder: 1,
    },
  });
  await prisma.examTemplateQuestion.createMany({
    data: questionVersionIds.map((questionVersionId, index) => ({
      examTemplateSectionSubjectId: sectionSubject.id,
      questionVersionId,
      marks: 1,
      negativeMarks: 0,
      isMandatory: true,
      sortOrder: index + 1,
    })),
  });
  const exam = await prisma.exam.create({
    data: {
      organizationId,
      sessionId,
      examTemplateVersionId: templateVersion.id,
      code: DEMO_EXAM_CODE,
      title: 'Demo Foundation Check',
      instructions: 'A short assessment to demonstrate the exam workflow.',
      availableFrom: new Date('2026-01-01T00:00:00.000Z'),
      availableUntil: new Date('2027-12-31T23:59:59.000Z'),
      durationMinutes: 15,
      attemptLimit: 5,
      autoSubmitOnTimeout: true,
      allowResume: true,
      resultReleaseMode: ExamResultReleaseMode.IMMEDIATE,
      showScore: true,
      showCorrectAnswers: true,
      showExplanations: true,
      showQuestionReview: true,
      status: ExamStatus.SCHEDULED,
      isActive: true,
      selectedSlots: { create: { examTemplateSlotId: slot.id, sortOrder: 1 } },
      courseAssignments: { create: { sessionCourseId } },
    },
  });
  await prisma.resource.create({
    data: {
      uuid: DEMO_EXAM_RESOURCE_UUID,
      folderId,
      title: 'Demo Foundation Check',
      description:
        'A minimal published exam resource connected to a valid exam.',
      resourceTypeId: RESOURCE_TYPE_IDS.EXAM,
      examId: exam.id,
      sortOrder: 1,
      status: ResourceStatus.PUBLISHED,
      isPublished: true,
      isDownloadable: false,
      isActive: true,
    },
  });

  return exam;
}

async function cleanupDemoExam(organizationId: number) {
  const exams = await prisma.exam.findMany({
    where: { organizationId, code: DEMO_EXAM_CODE },
    select: { id: true },
  });
  const examIds = exams.map(({ id }) => id);
  if (examIds.length) {
    await prisma.studentExamAttempt.deleteMany({
      where: { examId: { in: examIds } },
    });
    await prisma.resource.deleteMany({ where: { examId: { in: examIds } } });
    await prisma.exam.deleteMany({ where: { id: { in: examIds } } });
  }
  await prisma.resource.deleteMany({
    where: { uuid: DEMO_EXAM_RESOURCE_UUID },
  });
  await prisma.examTemplate.deleteMany({
    where: { organizationId, code: `TPL-${DEMO_EXAM_CODE}` },
  });
}

async function seedDemoQuestions(organizationId: number, subjectId: number) {
  const seeds = [
    {
      code: 'DEMO-Q-001',
      content: 'What is 15 percent of 200?',
      explanation: '15 percent of 200 is 30.',
      options: ['20', '25', '30', '35'],
      correctIndex: 2,
    },
    {
      code: 'DEMO-Q-002',
      content: 'Choose the word closest in meaning to practical.',
      explanation: 'Pragmatic means practical.',
      options: ['Pragmatic', 'Random', 'Ancient', 'Silent'],
      correctIndex: 0,
    },
  ];
  const versionIds: number[] = [];

  for (const seed of seeds) {
    const question = await prisma.question.upsert({
      where: { organizationId_code: { organizationId, code: seed.code } },
      update: { subjectId, status: QuestionStatus.PUBLISHED, isActive: true },
      create: {
        organizationId,
        subjectId,
        code: seed.code,
        status: QuestionStatus.PUBLISHED,
        isActive: true,
      },
    });
    let version = await prisma.questionVersion.findUnique({
      where: {
        questionId_versionNumber: {
          questionId: question.id,
          versionNumber: 1,
        },
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
          questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
          content: seed.content,
          explanation: seed.explanation,
          defaultMarks: 1,
          defaultNegativeMarks: 0,
          virtualKeyboardMode: ExamVirtualKeyboardMode.NONE,
          allowPhysicalKeyboard: true,
          allowPaste: false,
          isPublished: true,
        },
      });
    } else {
      version = await prisma.questionVersion.create({
        data: {
          questionId: question.id,
          questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
          versionNumber: 1,
          content: seed.content,
          explanation: seed.explanation,
          defaultMarks: 1,
          defaultNegativeMarks: 0,
          virtualKeyboardMode: ExamVirtualKeyboardMode.NONE,
          allowPhysicalKeyboard: true,
          allowPaste: false,
          isPublished: true,
        },
      });
    }
    await prisma.questionOption.createMany({
      data: seed.options.map((content, index) => ({
        questionVersionId: version.id,
        code: String.fromCharCode(65 + index),
        content,
        isCorrect: index === seed.correctIndex,
        sortOrder: index + 1,
      })),
    });
    versionIds.push(version.id);
  }

  return versionIds;
}

async function seedStudentEnrollment(
  studentId: number,
  organizationId: number,
  sessionId: number,
  sessionCourseId: number,
  lastAccessedResourceFolderId: number,
) {
  const enrollment = await prisma.studentEnrollment.upsert({
    where: { studentId_sessionId: { studentId, sessionId } },
    update: {
      organizationId,
      status: StudentEnrollmentStatus.ACTIVE,
      isActive: true,
    },
    create: {
      studentId,
      organizationId,
      sessionId,
      status: StudentEnrollmentStatus.ACTIVE,
      isActive: true,
    },
  });
  await prisma.studentCourseEnrollment.upsert({
    where: {
      enrollmentId_sessionCourseId: {
        enrollmentId: enrollment.id,
        sessionCourseId,
      },
    },
    update: {
      status: StudentCourseEnrollmentStatus.ACTIVE,
      isActive: true,
    },
    create: {
      enrollmentId: enrollment.id,
      sessionCourseId,
      status: StudentCourseEnrollmentStatus.ACTIVE,
      isActive: true,
    },
  });
  const firstResource = await prisma.resource.findFirst({
    where: { folderId: lastAccessedResourceFolderId, isActive: true },
    select: { id: true },
  });
  await prisma.studentCourseProgress.upsert({
    where: { studentId_sessionCourseId: { studentId, sessionCourseId } },
    update: {
      completionPercentage: 10,
      lastAccessedResourceId: firstResource?.id ?? null,
    },
    create: {
      studentId,
      sessionCourseId,
      completionPercentage: 10,
      lastAccessedResourceId: firstResource?.id ?? null,
    },
  });
}

async function seedEducationOptions(organizationId: number) {
  const names = ['12th Pass', 'Undergraduate', 'Graduate', 'PG and Above'];
  return Promise.all(
    names.map((name, index) =>
      prisma.organizationEducationOption.upsert({
        where: { organizationId_name: { organizationId, name } },
        update: { sortOrder: index, isActive: true },
        create: { organizationId, name, sortOrder: index, isActive: true },
      }),
    ),
  );
}

async function seedDigitalLibraryLocations(organizationId: number) {
  const names = ['Demo Centre 1', 'Demo Centre 2', 'Demo Centre 3'];
  return Promise.all(
    names.map((name, index) =>
      prisma.organizationDigitalLibraryLocation.upsert({
        where: { organizationId_name: { organizationId, name } },
        update: { sortOrder: index, isActive: true },
        create: { organizationId, name, sortOrder: index, isActive: true },
      }),
    ),
  );
}

async function seedRegistrationPage(
  organizationId: number,
  sessionId: number,
  sessionCourseId: number,
  educationOptionIds: number[],
  digitalLibraryLocationIds: number[],
) {
  const page = await prisma.organizationRegistrationPage.upsert({
    where: { slug: DEMO_REGISTRATION_SLUG },
    update: {
      organizationId,
      sessionId,
      title: 'LMS Demo Student Registration',
      description:
        'Register for the LMS demo course with organization-specific education and library options.',
      primaryColor: '#059669',
      accentColor: '#2563EB',
      supportEmail: 'support@lmsdemo.example.com',
      submitButtonText: 'Submit Registration',
      successTitle: 'Registration Successful',
      successMessage: 'Your demo registration has been received.',
      registrationEnabled: true,
      status: RegistrationPageStatus.ACTIVE,
      isActive: true,
    },
    create: {
      organizationId,
      sessionId,
      slug: DEMO_REGISTRATION_SLUG,
      title: 'LMS Demo Student Registration',
      description:
        'Register for the LMS demo course with organization-specific education and library options.',
      primaryColor: '#059669',
      accentColor: '#2563EB',
      supportEmail: 'support@lmsdemo.example.com',
      submitButtonText: 'Submit Registration',
      successTitle: 'Registration Successful',
      successMessage: 'Your demo registration has been received.',
      registrationEnabled: true,
      status: RegistrationPageStatus.ACTIVE,
      isActive: true,
    },
  });

  await prisma.organizationRegistrationPageCourse.upsert({
    where: {
      registrationPageId_sessionCourseId: {
        registrationPageId: page.id,
        sessionCourseId,
      },
    },
    update: { sortOrder: 0, isActive: true },
    create: {
      registrationPageId: page.id,
      sessionCourseId,
      sortOrder: 0,
      isActive: true,
    },
  });

  for (const [sortOrder, educationOptionId] of educationOptionIds.entries()) {
    await prisma.organizationRegistrationPageEducationOption.upsert({
      where: {
        registrationPageId_educationOptionId: {
          registrationPageId: page.id,
          educationOptionId,
        },
      },
      update: { sortOrder, isActive: true },
      create: {
        registrationPageId: page.id,
        educationOptionId,
        sortOrder,
        isActive: true,
      },
    });
  }

  for (const [
    sortOrder,
    digitalLibraryLocationId,
  ] of digitalLibraryLocationIds.entries()) {
    await prisma.organizationRegistrationPageDigitalLibraryLocation.upsert({
      where: {
        registrationPageId_digitalLibraryLocationId: {
          registrationPageId: page.id,
          digitalLibraryLocationId,
        },
      },
      update: { sortOrder, isActive: true },
      create: {
        registrationPageId: page.id,
        digitalLibraryLocationId,
        sortOrder,
        isActive: true,
      },
    });
  }

  return page;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
