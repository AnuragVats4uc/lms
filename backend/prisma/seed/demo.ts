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
  QuestionDifficulty,
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
const allPermissionKeys = [
  ...permissionModules.flatMap((module) =>
    crudActions.map((action) => `${module}.${action}`),
  ),
  'exam-answer.read',
];

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
      attemptLimit: 3,
      passingPercentage: 60,
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

  await seedExamVariantResources({
    organizationId,
    sessionId,
    sessionCourseId,
    folderId,
    subjectId: subject.id,
    questionVersionIds,
  });

  return exam;
}

async function seedExamVariantResources(input: {
  organizationId: number;
  sessionId: number;
  sessionCourseId: number;
  folderId: number;
  subjectId: number;
  questionVersionIds: number[];
}) {
  const allQuestions = input.questionVersionIds.map((_, index) => index);
  const variants: Array<{
    code: string;
    resourceUuid: string;
    title: string;
    description: string;
    durationMinutes: number;
    attemptLimit: number;
    allowResume: boolean;
    enforceSlotTimers: boolean;
    enforceSectionTimers: boolean;
    availableFrom: Date;
    availableUntil: Date;
    status: ExamStatus;
    slots: Array<{
      code: string;
      name: string;
      durationMinutes: number;
      navigationMode: ExamNavigationMode;
      autoSubmitOnTimeout: boolean;
      sections: Array<{
        code: string;
        name: string;
        durationMinutes: number;
        navigationMode: ExamNavigationMode;
        autoSubmitOnTimeout: boolean;
        randomizeQuestions?: boolean;
        randomizeOptions?: boolean;
        questionIndexes: number[];
      }>;
    }>;
  }> = [
    {
      code: 'DEMO-EXAM-TIMER',
      resourceUuid: '10000000-0000-4000-8000-000000000302',
      title: 'Exam Timer Practice — 10 Questions',
      description:
        'A standard resumable attempt governed by one overall exam timer.',
      durationMinutes: 20,
      attemptLimit: 2,
      allowResume: true,
      enforceSlotTimers: false,
      enforceSectionTimers: false,
      availableFrom: new Date('2026-01-01T00:00:00.000Z'),
      availableUntil: new Date('2027-12-31T23:59:59.000Z'),
      status: ExamStatus.SCHEDULED,
      slots: [
        {
          code: 'STANDARD',
          name: 'Standard Paper',
          durationMinutes: 20,
          navigationMode: ExamNavigationMode.FREE,
          autoSubmitOnTimeout: true,
          sections: [
            {
              code: 'ALL-QUESTIONS',
              name: 'All Questions',
              durationMinutes: 20,
              navigationMode: ExamNavigationMode.FREE,
              autoSubmitOnTimeout: true,
              questionIndexes: allQuestions,
            },
          ],
        },
      ],
    },
    {
      code: 'DEMO-SLOT-TIMER',
      resourceUuid: '10000000-0000-4000-8000-000000000303',
      title: 'Slot-Timed Assessment — 10 Questions',
      description:
        'Two separately timed five-question slots with a sequential first slot.',
      durationMinutes: 16,
      attemptLimit: 2,
      allowResume: true,
      enforceSlotTimers: true,
      enforceSectionTimers: false,
      availableFrom: new Date('2026-01-01T00:00:00.000Z'),
      availableUntil: new Date('2027-12-31T23:59:59.000Z'),
      status: ExamStatus.SCHEDULED,
      slots: [
        {
          code: 'SLOT-A',
          name: 'Core Skills Slot',
          durationMinutes: 8,
          navigationMode: ExamNavigationMode.SEQUENTIAL,
          autoSubmitOnTimeout: false,
          sections: [
            {
              code: 'CORE',
              name: 'Core Skills',
              durationMinutes: 8,
              navigationMode: ExamNavigationMode.SEQUENTIAL,
              autoSubmitOnTimeout: false,
              questionIndexes: [0, 1, 2, 3, 4],
            },
          ],
        },
        {
          code: 'SLOT-B',
          name: 'Applied Skills Slot',
          durationMinutes: 8,
          navigationMode: ExamNavigationMode.FREE,
          autoSubmitOnTimeout: true,
          sections: [
            {
              code: 'APPLIED',
              name: 'Applied Skills',
              durationMinutes: 8,
              navigationMode: ExamNavigationMode.FREE,
              autoSubmitOnTimeout: true,
              questionIndexes: [5, 6, 7, 8, 9],
            },
          ],
        },
      ],
    },
    {
      code: 'DEMO-SECTION-TIMER',
      resourceUuid: '10000000-0000-4000-8000-000000000304',
      title: 'Section-Timed Assessment — 10 Questions',
      description:
        'One paper with two separately timed sections and a manual timeout transition.',
      durationMinutes: 18,
      attemptLimit: 2,
      allowResume: true,
      enforceSlotTimers: false,
      enforceSectionTimers: true,
      availableFrom: new Date('2026-01-01T00:00:00.000Z'),
      availableUntil: new Date('2027-12-31T23:59:59.000Z'),
      status: ExamStatus.SCHEDULED,
      slots: [
        {
          code: 'SECTION-PAPER',
          name: 'Section-Timed Paper',
          durationMinutes: 18,
          navigationMode: ExamNavigationMode.FREE,
          autoSubmitOnTimeout: true,
          sections: [
            {
              code: 'FOUNDATION',
              name: 'Foundation Section',
              durationMinutes: 8,
              navigationMode: ExamNavigationMode.FREE,
              autoSubmitOnTimeout: false,
              questionIndexes: [0, 1, 2, 3, 4],
            },
            {
              code: 'ADVANCED',
              name: 'Advanced Section',
              durationMinutes: 10,
              navigationMode: ExamNavigationMode.SEQUENTIAL,
              autoSubmitOnTimeout: true,
              questionIndexes: [5, 6, 7, 8, 9],
            },
          ],
        },
      ],
    },
    {
      code: 'DEMO-LOCKED-NAVIGATION',
      resourceUuid: '10000000-0000-4000-8000-000000000305',
      title: 'Locked Navigation Assessment — 10 Questions',
      description:
        'A randomized paper demonstrating sequential and locked-after-submit navigation.',
      durationMinutes: 20,
      attemptLimit: 1,
      allowResume: false,
      enforceSlotTimers: false,
      enforceSectionTimers: false,
      availableFrom: new Date('2026-01-01T00:00:00.000Z'),
      availableUntil: new Date('2027-12-31T23:59:59.000Z'),
      status: ExamStatus.SCHEDULED,
      slots: [
        {
          code: 'LOCKED-PAPER',
          name: 'Controlled Navigation Paper',
          durationMinutes: 20,
          navigationMode: ExamNavigationMode.LOCKED_AFTER_SUBMIT,
          autoSubmitOnTimeout: true,
          sections: [
            {
              code: 'LOCKED',
              name: 'Locked Navigation Section',
              durationMinutes: 20,
              navigationMode: ExamNavigationMode.LOCKED_AFTER_SUBMIT,
              autoSubmitOnTimeout: true,
              randomizeQuestions: true,
              randomizeOptions: true,
              questionIndexes: allQuestions,
            },
          ],
        },
      ],
    },
    {
      code: 'DEMO-ENDED-WINDOW',
      resourceUuid: '10000000-0000-4000-8000-000000000306',
      title: 'Closed Exam Window — 10 Questions',
      description:
        'A closed assessment fixture used to verify the exam-ended student message.',
      durationMinutes: 15,
      attemptLimit: 1,
      allowResume: true,
      enforceSlotTimers: false,
      enforceSectionTimers: false,
      availableFrom: new Date('2026-01-01T00:00:00.000Z'),
      availableUntil: new Date('2026-07-31T23:59:59.000Z'),
      status: ExamStatus.CLOSED,
      slots: [
        {
          code: 'CLOSED-PAPER',
          name: 'Closed Paper',
          durationMinutes: 15,
          navigationMode: ExamNavigationMode.FREE,
          autoSubmitOnTimeout: true,
          sections: [
            {
              code: 'CLOSED-SECTION',
              name: 'Closed Exam Section',
              durationMinutes: 15,
              navigationMode: ExamNavigationMode.FREE,
              autoSubmitOnTimeout: true,
              questionIndexes: allQuestions,
            },
          ],
        },
      ],
    },
    {
      code: 'DEMO-UPCOMING-WINDOW',
      resourceUuid: '10000000-0000-4000-8000-000000000307',
      title: 'Upcoming Exam Window — 10 Questions',
      description:
        'A future assessment fixture used to verify the not-yet-open student message.',
      durationMinutes: 15,
      attemptLimit: 1,
      allowResume: true,
      enforceSlotTimers: false,
      enforceSectionTimers: false,
      availableFrom: new Date('2026-11-01T00:00:00.000Z'),
      availableUntil: new Date('2026-12-31T23:59:59.000Z'),
      status: ExamStatus.SCHEDULED,
      slots: [
        {
          code: 'UPCOMING-PAPER',
          name: 'Upcoming Paper',
          durationMinutes: 15,
          navigationMode: ExamNavigationMode.FREE,
          autoSubmitOnTimeout: true,
          sections: [
            {
              code: 'UPCOMING-SECTION',
              name: 'Upcoming Exam Section',
              durationMinutes: 15,
              navigationMode: ExamNavigationMode.FREE,
              autoSubmitOnTimeout: true,
              questionIndexes: allQuestions,
            },
          ],
        },
      ],
    },
  ];

  for (const [variantIndex, variant] of variants.entries()) {
    const template = await prisma.examTemplate.create({
      data: {
        organizationId: input.organizationId,
        code: `TPL-${variant.code}`,
        name: `${variant.title} Template`,
        description: variant.description,
        status: ExamTemplateStatus.PUBLISHED,
        isActive: true,
      },
    });
    const templateVersion = await prisma.examTemplateVersion.create({
      data: {
        examTemplateId: template.id,
        versionNumber: 1,
        instructions:
          'Read the timer and navigation rules carefully before beginning. Answers are saved automatically.',
        defaultDurationMinutes: variant.durationMinutes,
        defaultAttemptLimit: variant.attemptLimit,
        enforceSlotTimers: variant.enforceSlotTimers,
        enforceSectionTimers: variant.enforceSectionTimers,
        status: ExamTemplateVersionStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    const slotIds: number[] = [];
    for (const [slotIndex, slotConfig] of variant.slots.entries()) {
      const slot = await prisma.examTemplateSlot.create({
        data: {
          examTemplateVersionId: templateVersion.id,
          code: slotConfig.code,
          name: slotConfig.name,
          description: `${slotConfig.name} for ${variant.title}.`,
          instructions: `${slotConfig.durationMinutes} minutes are available for this slot.`,
          durationMinutes: slotConfig.durationMinutes,
          navigationMode: slotConfig.navigationMode,
          autoSubmitOnTimeout: slotConfig.autoSubmitOnTimeout,
          sortOrder: slotIndex + 1,
          isActive: true,
        },
      });
      slotIds.push(slot.id);
      for (const [sectionIndex, sectionConfig] of
        slotConfig.sections.entries()) {
        const section = await prisma.examTemplateSection.create({
          data: {
            examTemplateSlotId: slot.id,
            code: sectionConfig.code,
            name: sectionConfig.name,
            instructions: `Complete ${sectionConfig.questionIndexes.length} questions within ${sectionConfig.durationMinutes} minutes.`,
            durationMinutes: sectionConfig.durationMinutes,
            questionsToAttempt: sectionConfig.questionIndexes.length,
            randomizeQuestions: sectionConfig.randomizeQuestions ?? false,
            randomizeOptions: sectionConfig.randomizeOptions ?? false,
            navigationMode: sectionConfig.navigationMode,
            allowReview:
              sectionConfig.navigationMode !==
              ExamNavigationMode.LOCKED_AFTER_SUBMIT,
            autoSubmitOnTimeout: sectionConfig.autoSubmitOnTimeout,
            sortOrder: sectionIndex + 1,
            isActive: true,
          },
        });
        const sectionSubject =
          await prisma.examTemplateSectionSubject.create({
            data: {
              examTemplateSectionId: section.id,
              subjectId: input.subjectId,
              isMandatory: true,
              sortOrder: 1,
            },
          });
        await prisma.examTemplateQuestion.createMany({
          data: sectionConfig.questionIndexes.map(
            (questionIndex, questionOrder) => ({
              examTemplateSectionSubjectId: sectionSubject.id,
              questionVersionId: input.questionVersionIds[questionIndex],
              marks: questionIndex >= 7 ? 2 : 1,
              negativeMarks: questionIndex >= 7 ? 0.25 : 0,
              isMandatory: true,
              sortOrder: questionOrder + 1,
            }),
          ),
        });
      }
    }
    const exam = await prisma.exam.create({
      data: {
        organizationId: input.organizationId,
        sessionId: input.sessionId,
        examTemplateVersionId: templateVersion.id,
        code: variant.code,
        title: variant.title,
        instructions: variant.description,
        availableFrom: variant.availableFrom,
        availableUntil: variant.availableUntil,
        durationMinutes: variant.durationMinutes,
        attemptLimit: variant.attemptLimit,
        passingPercentage: 60,
        autoSubmitOnTimeout: true,
        allowResume: variant.allowResume,
        resultReleaseMode: ExamResultReleaseMode.IMMEDIATE,
        showScore: true,
        showCorrectAnswers: true,
        showExplanations: true,
        showQuestionReview: true,
        status: variant.status,
        isActive: true,
        selectedSlots: {
          create: slotIds.map((examTemplateSlotId, sortOrder) => ({
            examTemplateSlotId,
            sortOrder: sortOrder + 1,
          })),
        },
        courseAssignments: {
          create: { sessionCourseId: input.sessionCourseId },
        },
      },
    });
    await prisma.resource.create({
      data: {
        uuid: variant.resourceUuid,
        folderId: input.folderId,
        title: variant.title,
        description: variant.description,
        resourceTypeId: RESOURCE_TYPE_IDS.EXAM,
        examId: exam.id,
        sortOrder: variantIndex + 2,
        status: ResourceStatus.PUBLISHED,
        isPublished: true,
        isDownloadable: false,
        isActive: true,
      },
    });
  }
}

async function cleanupDemoExam(organizationId: number) {
  const exams = await prisma.exam.findMany({
    where: {
      organizationId,
      code: {
        in: [
          DEMO_EXAM_CODE,
          'DEMO-EXAM-TIMER',
          'DEMO-SLOT-TIMER',
          'DEMO-SECTION-TIMER',
          'DEMO-LOCKED-NAVIGATION',
          'DEMO-ENDED-WINDOW',
          'DEMO-UPCOMING-WINDOW',
        ],
      },
    },
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
    where: {
      uuid: {
        in: [
          DEMO_EXAM_RESOURCE_UUID,
          '10000000-0000-4000-8000-000000000302',
          '10000000-0000-4000-8000-000000000303',
          '10000000-0000-4000-8000-000000000304',
          '10000000-0000-4000-8000-000000000305',
          '10000000-0000-4000-8000-000000000306',
          '10000000-0000-4000-8000-000000000307',
        ],
      },
    },
  });
  await prisma.examTemplate.deleteMany({
    where: {
      organizationId,
      code: {
        in: [
          `TPL-${DEMO_EXAM_CODE}`,
          'TPL-DEMO-EXAM-TIMER',
          'TPL-DEMO-SLOT-TIMER',
          'TPL-DEMO-SECTION-TIMER',
          'TPL-DEMO-LOCKED-NAVIGATION',
          'TPL-DEMO-ENDED-WINDOW',
          'TPL-DEMO-UPCOMING-WINDOW',
        ],
      },
    },
  });
}

async function seedDemoQuestions(organizationId: number, subjectId: number) {
  const topics = await Promise.all(
    [
      {
        code: 'DEMO-ARITHMETIC',
        name: 'Arithmetic',
        description: 'Percentages, ratios, and applied calculations.',
      },
      {
        code: 'DEMO-LANGUAGE',
        name: 'Language Skills',
        description: 'Vocabulary and reading comprehension.',
      },
      {
        code: 'DEMO-REASONING',
        name: 'Logical Reasoning',
        description: 'Patterns, sequences, and analytical reasoning.',
      },
    ].map((topic, sortOrder) =>
      prisma.topic.upsert({
        where: { subjectId_code: { subjectId, code: topic.code } },
        update: {
          organizationId,
          name: topic.name,
          description: topic.description,
          sortOrder: sortOrder + 1,
          isActive: true,
        },
        create: {
          organizationId,
          subjectId,
          ...topic,
          sortOrder: sortOrder + 1,
          isActive: true,
        },
      }),
    ),
  );
  const topicByCode = new Map(topics.map((topic) => [topic.code, topic.id]));
  const comprehension = await prisma.questionComprehension.upsert({
    where: {
      organizationId_code: {
        organizationId,
        code: 'DEMO-PASSAGE-CLIMATE-LIBRARY',
      },
    },
    update: {
      content:
        '<p>A city library reduced electricity use by replacing old lights and adding rooftop solar panels. In its first year, consumption fell by 18 percent while visitor numbers increased.</p>',
      isActive: true,
    },
    create: {
      organizationId,
      code: 'DEMO-PASSAGE-CLIMATE-LIBRARY',
      content:
        '<p>A city library reduced electricity use by replacing old lights and adding rooftop solar panels. In its first year, consumption fell by 18 percent while visitor numbers increased.</p>',
      isActive: true,
    },
  });
  const seeds: Array<{
    code: string;
    content: string;
    explanation: string;
    questionTypeId: number;
    difficulty: QuestionDifficulty;
    topicCode: string;
    options?: string[];
    correctIndex?: number;
    textAnswer?: string;
    numericAnswer?: number;
    numericTolerance?: number;
    comprehensionId?: number;
  }> = [
    {
      code: 'DEMO-Q-001',
      content: 'What is 15 percent of 200?',
      explanation: '15 percent of 200 is 30.',
      questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
      difficulty: QuestionDifficulty.EASY,
      topicCode: 'DEMO-ARITHMETIC',
      options: ['20', '25', '30', '35'],
      correctIndex: 2,
    },
    {
      code: 'DEMO-Q-002',
      content: 'Choose the word closest in meaning to practical.',
      explanation: 'Pragmatic means practical.',
      questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
      difficulty: QuestionDifficulty.EASY,
      topicCode: 'DEMO-LANGUAGE',
      options: ['Pragmatic', 'Random', 'Ancient', 'Silent'],
      correctIndex: 0,
    },
    {
      code: 'DEMO-Q-003',
      content: 'Enter the value of 12 multiplied by 12.',
      explanation: '12 × 12 equals 144.',
      questionTypeId: QUESTION_TYPE_IDS.NUMERIC,
      difficulty: QuestionDifficulty.MEDIUM,
      topicCode: 'DEMO-ARITHMETIC',
      numericAnswer: 144,
      numericTolerance: 0,
    },
    {
      code: 'DEMO-Q-004',
      content: 'Write one word that means “moving very quickly”.',
      explanation: 'Rapid means moving very quickly.',
      questionTypeId: QUESTION_TYPE_IDS.ONE_WORD,
      difficulty: QuestionDifficulty.EASY,
      topicCode: 'DEMO-LANGUAGE',
      textAnswer: 'rapid',
    },
    {
      code: 'DEMO-Q-005',
      content: 'Complete the sequence: 2, 6, 12, 20, __.',
      explanation: 'The differences are 4, 6, 8, then 10; therefore 30.',
      questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
      difficulty: QuestionDifficulty.MEDIUM,
      topicCode: 'DEMO-REASONING',
      options: ['26', '28', '30', '32'],
      correctIndex: 2,
    },
    {
      code: 'DEMO-Q-006',
      content: 'A price of 50 is reduced by 25 percent. Enter the new price.',
      explanation: '25 percent of 50 is 12.5, so the new price is 37.5.',
      questionTypeId: QUESTION_TYPE_IDS.NUMERIC,
      difficulty: QuestionDifficulty.HARD,
      topicCode: 'DEMO-ARITHMETIC',
      numericAnswer: 37.5,
      numericTolerance: 0.01,
    },
    {
      code: 'DEMO-Q-007',
      content: 'Name the process plants use to convert light into food.',
      explanation: 'Plants use photosynthesis to convert light energy into food.',
      questionTypeId: QUESTION_TYPE_IDS.ONE_WORD,
      difficulty: QuestionDifficulty.MEDIUM,
      topicCode: 'DEMO-LANGUAGE',
      textAnswer: 'photosynthesis',
    },
    {
      code: 'DEMO-Q-008',
      content:
        '<p>Which option completes the visual pattern?</p><img alt="Pattern showing one, two, then three blue squares" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27320%27 height=%2780%27 viewBox=%270 0 320 80%27%3E%3Crect x=%2710%27 y=%2725%27 width=%2730%27 height=%2730%27 rx=%274%27 fill=%27%233976ee%27/%3E%3Crect x=%2795%27 y=%2725%27 width=%2730%27 height=%2730%27 rx=%274%27 fill=%27%233976ee%27/%3E%3Crect x=%27132%27 y=%2725%27 width=%2730%27 height=%2730%27 rx=%274%27 fill=%27%233976ee%27/%3E%3Crect x=%27215%27 y=%2725%27 width=%2730%27 height=%2730%27 rx=%274%27 fill=%27%233976ee%27/%3E%3Crect x=%27252%27 y=%2725%27 width=%2730%27 height=%2730%27 rx=%274%27 fill=%27%233976ee%27/%3E%3Ctext x=%27300%27 y=%2748%27 font-size=%2724%27%3E?%3C/text%3E%3C/svg%3E" />',
      explanation: 'Each group adds one square, so the next group contains four.',
      questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
      difficulty: QuestionDifficulty.HARD,
      topicCode: 'DEMO-REASONING',
      options: ['One square', 'Two squares', 'Three squares', 'Four squares'],
      correctIndex: 3,
    },
    {
      code: 'DEMO-Q-009',
      content: 'What change reduced the library’s electricity use?',
      explanation: 'The library replaced old lights and installed solar panels.',
      questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
      difficulty: QuestionDifficulty.MEDIUM,
      topicCode: 'DEMO-LANGUAGE',
      comprehensionId: comprehension.id,
      options: [
        'Shorter opening hours',
        'New lighting and solar panels',
        'Fewer visitors',
        'Removing computers',
      ],
      correctIndex: 1,
    },
    {
      code: 'DEMO-Q-010',
      content: 'Which conclusion is best supported by the passage?',
      explanation: 'Energy use fell even though visitor numbers increased.',
      questionTypeId: QUESTION_TYPE_IDS.SINGLE_CHOICE,
      difficulty: QuestionDifficulty.HARD,
      topicCode: 'DEMO-REASONING',
      comprehensionId: comprehension.id,
      options: [
        'The library became less popular.',
        'The energy improvements were effective.',
        'Solar panels increased consumption.',
        'Visitor numbers caused the reduction.',
      ],
      correctIndex: 1,
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
          questionTypeId: seed.questionTypeId,
          topicId: topicByCode.get(seed.topicCode),
          comprehensionId: seed.comprehensionId ?? null,
          content: seed.content,
          explanation: seed.explanation,
          difficulty: seed.difficulty,
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
          questionTypeId: seed.questionTypeId,
          topicId: topicByCode.get(seed.topicCode),
          comprehensionId: seed.comprehensionId ?? null,
          versionNumber: 1,
          content: seed.content,
          explanation: seed.explanation,
          difficulty: seed.difficulty,
          defaultMarks: 1,
          defaultNegativeMarks: 0,
          virtualKeyboardMode: ExamVirtualKeyboardMode.NONE,
          allowPhysicalKeyboard: true,
          allowPaste: false,
          isPublished: true,
        },
      });
    }
    if (seed.options?.length) {
      await prisma.questionOption.createMany({
        data: seed.options.map((content, index) => ({
          questionVersionId: version.id,
          code: String.fromCharCode(65 + index),
          content,
          isCorrect: index === seed.correctIndex,
          sortOrder: index + 1,
        })),
      });
    }
    if (seed.textAnswer !== undefined) {
      await prisma.questionAcceptedAnswer.create({
        data: {
          questionVersionId: version.id,
          textValue: seed.textAnswer,
          normalizedText: seed.textAnswer.toLowerCase(),
          isPrimary: true,
          sortOrder: 1,
        },
      });
    }
    if (seed.numericAnswer !== undefined) {
      await prisma.questionAcceptedAnswer.create({
        data: {
          questionVersionId: version.id,
          numericValue: seed.numericAnswer,
          numericTolerance: seed.numericTolerance ?? 0,
          isPrimary: true,
          sortOrder: 1,
        },
      });
    }
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
