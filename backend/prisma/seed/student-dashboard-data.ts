import {
  CourseStatus,
  PrismaClient,
  ResourceStatus,
  ResourceType,
  SessionCourseStatus,
  SessionStatus,
  StudentNotificationType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const courses = [
  {
    code: 'QA',
    completion: 68,
    folderName: 'Aptitude Notes',
    instructor: { firstName: 'Ritika', lastName: 'Mehra' },
    name: 'Quantitative Aptitude',
    resourceTitle: 'Permutation & Combination Notes',
    resourceType: ResourceType.DOCUMENT,
  },
  {
    code: 'VA',
    completion: 56,
    folderName: 'Verbal Lessons',
    instructor: { firstName: 'Nidhi', lastName: 'Arora' },
    name: 'Verbal Ability',
    resourceTitle: 'Linear Equations - Part 2',
    resourceType: ResourceType.VIDEO,
  },
  {
    code: 'LR',
    completion: 42,
    folderName: 'Reasoning Practice',
    instructor: { firstName: 'Aman', lastName: 'Verma' },
    name: 'Logical Reasoning',
    resourceTitle: 'Reading Comprehension Strategies',
    resourceType: ResourceType.NOTES,
  },
  {
    code: 'MT',
    completion: 75,
    folderName: 'Mock Test Assignments',
    instructor: { firstName: 'Test', lastName: 'Series' },
    name: 'Mock Tests',
    resourceTitle: 'Logical Reasoning Practice Set 05',
    resourceType: ResourceType.ASSIGNMENT,
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
    await seedForStudent(student.id, student.organizationId!, password, roleByCode);
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
  studentId: number,
  organizationId: number,
  password: string,
  roleByCode: Map<string, number>,
) {
  const now = new Date();
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
      userId_sessionId: {
        sessionId: session.id,
        userId: studentId,
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
      userId: studentId,
    },
    select: { id: true },
  });

  await ensureRole(studentId, roleByCode.get('STUDENT'), organizationId);

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
    );

    await prisma.studentCourseProgress.upsert({
      where: {
        userId_sessionCourseId: {
          sessionCourseId: sessionCourse.id,
          userId: studentId,
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
        userId: studentId,
      },
    });
  }

  for (const notification of notifications) {
    await upsertNotification(studentId, organizationId, notification, now);
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
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.org${organizationId}@pratham.test`;

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
  type: ResourceType,
  sortOrder: number,
  createdAt: Date,
) {
  const existing = await prisma.resource.findFirst({
    where: { folderId, title },
    select: { id: true },
  });
  const data = {
    createdAt,
    description: `${title} dashboard content.`,
    documentUrl:
      type === ResourceType.DOCUMENT || type === ResourceType.NOTES
        ? `https://cdn.example.com/lms/demo/${folderId}-${sortOrder}.pdf`
        : null,
    durationInSeconds:
      type === ResourceType.VIDEO ? 1_200 + sortOrder * 120 : null,
    examId: type === ResourceType.EXAM ? 900_000 + sortOrder : null,
    fileSize:
      type === ResourceType.DOCUMENT || type === ResourceType.NOTES
        ? BigInt(420_000 + sortOrder * 15_000)
        : null,
    isActive: true,
    isDownloadable: type !== ResourceType.VIDEO,
    isPublished: true,
    mimeType:
      type === ResourceType.VIDEO
        ? 'video/mp4'
        : type === ResourceType.ASSIGNMENT
          ? 'application/json'
          : 'application/pdf',
    sortOrder,
    status: ResourceStatus.PUBLISHED,
    title,
    type,
    videoUrl:
      type === ResourceType.VIDEO
        ? `https://cdn.example.com/lms/demo/${folderId}-${sortOrder}.mp4`
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
  userId: number,
  organizationId: number,
  notification: (typeof notifications)[number],
  now: Date,
) {
  const existing = await prisma.studentNotification.findFirst({
    where: {
      organizationId,
      title: notification.title,
      type: notification.type,
      userId,
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
      userId,
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
