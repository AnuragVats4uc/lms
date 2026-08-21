import {
  CourseStatus,
  PrismaClient,
  ResourceStatus,
  SessionCourseStatus,
  SessionStatus,
  StudentNotificationType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  RESOURCE_TYPE_IDS,
  ResourceTypeId,
} from '../../src/modules/resource/constants/resource-type.constants';
import { seedResourceTypes } from './resource-types';

const prisma = new PrismaClient();

const courses = [
  {
    code: 'QA',
    completion: 68,
    documentUrl:
      'https://digital.nios.ac.in/content/311en/311_Maths_Eng_Lesson11.pdf',
    folderName: 'Aptitude Notes',
    instructor: { firstName: 'Ritika', lastName: 'Mehra' },
    name: 'Quantitative Aptitude',
    resourceTitle: 'Permutation & Combination Notes',
    resourceType: RESOURCE_TYPE_IDS.DOCUMENT,
  },
  {
    code: 'VA',
    completion: 56,
    documentUrl: null,
    folderName: 'Verbal Lessons',
    instructor: { firstName: 'Nidhi', lastName: 'Arora' },
    name: 'Verbal Ability',
    resourceTitle: 'Linear Equations - Part 2',
    resourceType: RESOURCE_TYPE_IDS.VIDEO,
  },
  {
    code: 'LR',
    completion: 42,
    documentUrl:
      'https://cbseacademic.nic.in/web_material/publication/Class_X_ENGLISH_WORKBOOK/001-010.pdf',
    folderName: 'Reasoning Practice',
    instructor: { firstName: 'Aman', lastName: 'Verma' },
    name: 'Logical Reasoning',
    resourceTitle: 'Reading Comprehension Strategies',
    resourceType: RESOURCE_TYPE_IDS.DOCUMENT,
  },
  {
    code: 'MT',
    completion: 75,
    documentUrl:
      'https://digital.nios.ac.in/content/311en/311_Maths_Eng_Lesson10.pdf',
    folderName: 'Mock Test Assignments',
    instructor: { firstName: 'Test', lastName: 'Series' },
    name: 'Mock Tests',
    resourceTitle: 'Logical Reasoning Practice Set 05',
    resourceType: RESOURCE_TYPE_IDS.DOCUMENT,
  },
];

const notifications = [
  {
    description: 'Logical Reasoning Set 04 is due tomorrow.',
    hoursAgo: 2,
    title: 'Assignment Reminder',
    type: StudentNotificationType.ASSIGNMENT,
  },
  {
    description: 'IPMAT Mock Test on Sunday at 11:00 AM.',
    hoursAgo: 5,
    title: 'Important Announcement',
    type: StudentNotificationType.ANNOUNCEMENT,
  },
  {
    description: 'Verbal Ability Live Class at 4:30 PM today.',
    hoursAgo: 24,
    title: 'Upcoming Event',
    type: StudentNotificationType.EVENT,
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'The demo dashboard seed is disabled in production because it creates known development credentials.',
    );
  }

  await seedResourceTypes(prisma);
  const password = await bcrypt.hash('Admin@123', 10);
  const roles = await prisma.role.findMany({
    where: { code: { in: ['ADMIN', 'STUDENT'] } },
    select: { code: true, id: true },
  });
  const roleByCode = new Map(roles.map((role) => [role.code, role.id]));
  const students = await prisma.user.findMany({
    where: {
      organizationId: { not: null },
      userRoles: {
        some: {
          isActive: true,
          role: { code: 'STUDENT' },
        },
      },
    },
    select: {
      email: true,
      id: true,
      organizationId: true,
    },
    orderBy: { id: 'asc' },
  });

  for (const student of students) {
    await seedForStudent(
      student.id,
      student.email,
      student.organizationId!,
      password,
      roleByCode,
    );
  }

  console.log(
    JSON.stringify(
      { updatedStudents: students.map((student) => student.email) },
      null,
      2,
    ),
  );
}

async function seedForStudent(
  userId: number,
  email: string,
  organizationId: number,
  password: string,
  roleByCode: Map<string, number>,
) {
  const now = new Date();
  const student = await prisma.student.upsert({
    where: { userId },
    update: {
      isActive: true,
      organizationId,
      status: 'ACTIVE',
      studentCode: `STU-${userId}`,
      profile: {
        upsert: {
          create: {
            firstName: email.split('@')[0]?.split('.')[0] ?? 'Student',
            lastName: 'Learner',
          },
          update: {},
        },
      },
    },
    create: {
      isActive: true,
      organizationId,
      status: 'ACTIVE',
      studentCode: `STU-${userId}`,
      userId,
      profile: {
        create: {
          firstName: email.split('@')[0]?.split('.')[0] ?? 'Student',
          lastName: 'Learner',
        },
      },
    },
    select: { id: true },
  });
  const session = await prisma.session.upsert({
    where: {
      organizationId_name: {
        name: 'IPMAT Foundation 2027',
        organizationId,
      },
    },
    update: {
      code: 'IPMAT-2027',
      endDate: new Date('2027-03-31T23:59:59.999Z'),
      isActive: true,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      status: SessionStatus.ACTIVE,
    },
    create: {
      code: 'IPMAT-2027',
      description: 'IPMAT Foundation 2027 student dashboard batch.',
      endDate: new Date('2027-03-31T23:59:59.999Z'),
      isActive: true,
      name: 'IPMAT Foundation 2027',
      organizationId,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      status: SessionStatus.ACTIVE,
    },
    select: { id: true },
  });
  const enrollment = await prisma.studentEnrollment.upsert({
    where: {
      studentId_sessionId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
    update: {
      isActive: true,
      organizationId,
      status: 'ACTIVE',
    },
    create: {
      isActive: true,
      organizationId,
      sessionId: session.id,
      status: 'ACTIVE',
      studentId: student.id,
    },
    select: { id: true },
  });

  await ensureRole(userId, roleByCode.get('STUDENT'), organizationId);

  for (const [sortOrder, item] of courses.entries()) {
    const course = await prisma.course.upsert({
      where: { code: item.code },
      update: {
        isActive: true,
        name: item.name,
        status: CourseStatus.ACTIVE,
      },
      create: {
        code: item.code,
        description: `${item.name} dashboard course.`,
        isActive: true,
        name: item.name,
        status: CourseStatus.ACTIVE,
      },
      select: { id: true },
    });
    const sessionCourse = await prisma.sessionCourse.upsert({
      where: {
        sessionId_courseId: {
          courseId: course.id,
          sessionId: session.id,
        },
      },
      update: {
        displayName: item.name,
        isActive: true,
        isPublished: true,
        sortOrder,
        status: SessionCourseStatus.ACTIVE,
      },
      create: {
        courseId: course.id,
        displayName: item.name,
        isActive: true,
        isPublished: true,
        sessionId: session.id,
        sortOrder,
        status: SessionCourseStatus.ACTIVE,
      },
      select: { id: true },
    });

    await prisma.studentCourseEnrollment.upsert({
      where: {
        enrollmentId_sessionCourseId: {
          enrollmentId: enrollment.id,
          sessionCourseId: sessionCourse.id,
        },
      },
      update: { isActive: true, status: 'ACTIVE' },
      create: {
        enrollmentId: enrollment.id,
        isActive: true,
        sessionCourseId: sessionCourse.id,
        status: 'ACTIVE',
      },
    });

    const instructor = await upsertInstructor(
      item.instructor.firstName,
      item.instructor.lastName,
      organizationId,
      password,
    );
    await ensureRole(instructor.id, roleByCode.get('ADMIN'), organizationId);
    await prisma.courseInstructor.upsert({
      where: {
        sessionCourseId_instructorId: {
          instructorId: instructor.id,
          sessionCourseId: sessionCourse.id,
        },
      },
      update: {},
      create: {
        instructorId: instructor.id,
        sessionCourseId: sessionCourse.id,
      },
    });

    const folder = await upsertFolder(
      sessionCourse.id,
      item.folderName,
      sortOrder,
    );
    const resource = await upsertResource(
      folder.id,
      item.resourceTitle,
      item.resourceType,
      sortOrder,
      new Date(now.getTime() - (sortOrder + 1) * 24 * 60 * 60 * 1000),
      item.documentUrl,
    );

    await prisma.studentCourseProgress.upsert({
      where: {
        studentId_sessionCourseId: {
          sessionCourseId: sessionCourse.id,
          studentId: student.id,
        },
      },
      update: {
        completionPercentage: item.completion,
        lastAccessedResourceId: resource.id,
      },
      create: {
        completionPercentage: item.completion,
        lastAccessedResourceId: resource.id,
        sessionCourseId: sessionCourse.id,
        studentId: student.id,
      },
    });
  }

  for (const notification of notifications) {
    await upsertNotification(student.id, organizationId, notification, now);
  }
}

async function ensureRole(
  userId: number,
  roleId: number | undefined,
  organizationId: number,
) {
  if (!roleId) return;

  const existing = await prisma.userRole.findFirst({
    where: { organizationId, roleId, userId },
    select: { id: true },
  });

  if (existing) {
    await prisma.userRole.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
    return;
  }

  await prisma.userRole.create({
    data: { isActive: true, organizationId, roleId, userId },
  });
}

async function upsertInstructor(
  firstName: string,
  lastName: string,
  organizationId: number,
  password: string,
) {
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.org${organizationId}@lms.test`;

  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      isActive: true,
      isVerified: true,
      lastName,
      organizationId,
      password,
      status: 'ACTIVE',
    },
    create: {
      email,
      firstName,
      isActive: true,
      isVerified: true,
      lastName,
      organizationId,
      password,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
}

async function upsertFolder(
  sessionCourseId: number,
  name: string,
  sortOrder: number,
) {
  const existing = await prisma.folder.findFirst({
    where: { name, parentFolderId: null, sessionCourseId },
    select: { id: true },
  });
  const data = {
    color: ['#059669', '#2563EB', '#7C3AED', '#D97706'][sortOrder],
    description: `${name} dashboard resources.`,
    icon: 'folder',
    isActive: true,
    sortOrder,
    status: 'ACTIVE' as const,
  };

  if (existing) {
    return prisma.folder.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
  }

  return prisma.folder.create({
    data: { ...data, name, sessionCourseId },
    select: { id: true },
  });
}

async function upsertResource(
  folderId: number,
  title: string,
  type: ResourceTypeId,
  sortOrder: number,
  createdAt: Date,
  documentUrl: string | null,
) {
  const existing = await prisma.resource.findFirst({
    where: { folderId, title },
    select: { id: true },
  });
  const data = {
    createdAt,
    description:
      type === RESOURCE_TYPE_IDS.VIDEO
        ? 'An instructional lesson on solving linear equations of the form ax + b = c, with worked examples and equation-checking strategies.'
        : `${title} dashboard content.`,
    documentUrl: type === RESOURCE_TYPE_IDS.DOCUMENT ? documentUrl : null,
    durationInSeconds: type === RESOURCE_TYPE_IDS.VIDEO ? 367 : null,
    examId: type === RESOURCE_TYPE_IDS.EXAM ? 900_000 + sortOrder : null,
    fileSize:
      type === RESOURCE_TYPE_IDS.DOCUMENT
        ? BigInt(420_000 + sortOrder * 15_000)
        : null,
    isActive: true,
    isDownloadable: type !== RESOURCE_TYPE_IDS.VIDEO,
    isPublished: true,
    mimeType:
      type === RESOURCE_TYPE_IDS.VIDEO ? 'video/youtube' : 'application/pdf',
    sortOrder,
    status: ResourceStatus.PUBLISHED,
    title,
    thumbnail:
      type === RESOURCE_TYPE_IDS.VIDEO
        ? 'https://img.youtube.com/vi/DopnmxeMt-s/hqdefault.jpg'
        : null,
    resourceTypeId: type,
    videoUrl:
      type === RESOURCE_TYPE_IDS.VIDEO
        ? 'https://www.youtube.com/watch?v=DopnmxeMt-s'
        : null,
  };

  if (existing) {
    return prisma.resource.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
  }

  return prisma.resource.create({
    data: { ...data, folderId },
    select: { id: true },
  });
}

async function upsertNotification(
  studentId: number,
  organizationId: number,
  notification: (typeof notifications)[number],
  now: Date,
) {
  const existing = await prisma.studentNotification.findFirst({
    where: {
      organizationId,
      title: notification.title,
      type: notification.type,
      studentId,
    },
    select: { id: true },
  });
  const data = {
    createdAt: new Date(now.getTime() - notification.hoursAgo * 60 * 60 * 1000),
    description: notification.description,
    expiresAt: null,
    isRead: false,
  };

  if (existing) {
    await prisma.studentNotification.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await prisma.studentNotification.create({
    data: {
      ...data,
      organizationId,
      title: notification.title,
      type: notification.type,
      studentId,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error('Student dashboard data seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
