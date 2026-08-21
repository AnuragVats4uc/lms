import 'dotenv/config';
import {
  CourseStatus,
  OrganizationStatus,
  PrismaClient,
  SessionCourseStatus,
  SessionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const passwordSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

const organization = {
  code: 'LMS-DEMO',
  description: 'Development organization for student account validation.',
  name: 'LMS Demo Organization',
};

const session = {
  code: 'IPMAT-2027',
  description: 'IPMAT Foundation 2027 student batch.',
  endDate: new Date('2027-03-31T23:59:59.999Z'),
  name: 'IPMAT Foundation 2027',
  startDate: new Date('2026-04-01T00:00:00.000Z'),
};

const students = [
  {
    code: 'STU-2026-01',
    email: 'aarav.sharma@lms.test',
    firstName: 'Aarav',
    lastName: 'Sharma',
    password: 'LmsStudent@01!',
  },
  {
    code: 'STU-2026-02',
    email: 'diya.patel@lms.test',
    firstName: 'Diya',
    lastName: 'Patel',
    password: 'LmsStudent@02!',
  },
  {
    code: 'STU-2026-03',
    email: 'kabir.verma@lms.test',
    firstName: 'Kabir',
    lastName: 'Verma',
    password: 'LmsStudent@03!',
  },
  {
    code: 'STU-2026-04',
    email: 'anaya.mehta@lms.test',
    firstName: 'Anaya',
    lastName: 'Mehta',
    password: 'LmsStudent@04!',
  },
  {
    code: 'STU-2026-05',
    email: 'vihaan.iyer@lms.test',
    firstName: 'Vihaan',
    lastName: 'Iyer',
    password: 'LmsStudent@05!',
  },
] as const;

const courses = [
  {
    code: 'QA',
    name: 'Quantitative Aptitude',
  },
  {
    code: 'VA',
    name: 'Verbal Ability',
  },
  {
    code: 'LR',
    name: 'Logical Reasoning',
  },
  {
    code: 'MT',
    name: 'Mock Tests',
  },
  {
    code: 'GEN-KNOW',
    name: 'General Knowledge',
  },
] as const;

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'The demo student-account seed is disabled in production because it creates known development credentials.',
    );
  }

  const hashedPasswords = new Map(
    await Promise.all(
      students.map(async (student) => [
        student.email,
        await bcrypt.hash(student.password, passwordSaltRounds),
      ] as const),
    ),
  );

  const seededOrganization = await prisma.organization.upsert({
    where: { code: organization.code },
    update: {
      description: organization.description,
      isActive: true,
      name: organization.name,
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      ...organization,
      isActive: true,
      status: OrganizationStatus.ACTIVE,
    },
    select: { id: true },
  });

  const studentRole = await prisma.role.upsert({
    where: { code: 'STUDENT' },
    update: {
      description: 'Learner access',
      isActive: true,
      name: 'Student',
    },
    create: {
      code: 'STUDENT',
      description: 'Learner access',
      isActive: true,
      name: 'Student',
    },
    select: { id: true },
  });

  const seededSession = await prisma.session.upsert({
    where: {
      organizationId_name: {
        name: session.name,
        organizationId: seededOrganization.id,
      },
    },
    update: {
      code: session.code,
      description: session.description,
      endDate: session.endDate,
      isActive: true,
      startDate: session.startDate,
      status: SessionStatus.ACTIVE,
    },
    create: {
      ...session,
      isActive: true,
      organizationId: seededOrganization.id,
      status: SessionStatus.ACTIVE,
    },
    select: { id: true },
  });

  const sessionCourses = [] as Array<{ courseId: number; id: number }>;

  for (const [sortOrder, courseInput] of courses.entries()) {
    const course = await upsertCourse(courseInput);

    const sessionCourse = await prisma.sessionCourse.upsert({
      where: {
        sessionId_courseId: {
          courseId: course.id,
          sessionId: seededSession.id,
        },
      },
      update: {
        displayName: courseInput.name,
        isActive: true,
        isPublished: true,
        sortOrder,
        status: SessionCourseStatus.ACTIVE,
      },
      create: {
        courseId: course.id,
        displayName: courseInput.name,
        isActive: true,
        isPublished: true,
        sessionId: seededSession.id,
        sortOrder,
        status: SessionCourseStatus.ACTIVE,
      },
      select: { courseId: true, id: true },
    });

    sessionCourses.push(sessionCourse);
  }

  const credentials = [] as Array<{
    courses: string[];
    email: string;
    name: string;
    password: string;
  }>;

  for (const studentInput of students) {
    const user = await prisma.user.upsert({
      where: { email: studentInput.email },
      update: {
        firstName: studentInput.firstName,
        isActive: true,
        isVerified: true,
        lastName: studentInput.lastName,
        organizationId: seededOrganization.id,
        password: hashedPasswords.get(studentInput.email)!,
        status: 'ACTIVE',
      },
      create: {
        email: studentInput.email,
        firstName: studentInput.firstName,
        isActive: true,
        isVerified: true,
        lastName: studentInput.lastName,
        organizationId: seededOrganization.id,
        password: hashedPasswords.get(studentInput.email)!,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        isActive: true,
        organizationId: seededOrganization.id,
        profile: {
          upsert: {
            create: {
              firstName: studentInput.firstName,
              lastName: studentInput.lastName,
            },
            update: {
              firstName: studentInput.firstName,
              lastName: studentInput.lastName,
            },
          },
        },
        status: 'ACTIVE',
        studentCode: studentInput.code,
      },
      create: {
        isActive: true,
        organizationId: seededOrganization.id,
        profile: {
          create: {
            firstName: studentInput.firstName,
            lastName: studentInput.lastName,
          },
        },
        status: 'ACTIVE',
        studentCode: studentInput.code,
        userId: user.id,
      },
      select: { id: true },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_organizationId: {
          organizationId: seededOrganization.id,
          roleId: studentRole.id,
          userId: user.id,
        },
      },
      update: { isActive: true },
      create: {
        isActive: true,
        organizationId: seededOrganization.id,
        roleId: studentRole.id,
        userId: user.id,
      },
    });

    const enrollment = await prisma.studentEnrollment.upsert({
      where: {
        studentId_sessionId: {
          sessionId: seededSession.id,
          studentId: student.id,
        },
      },
      update: {
        isActive: true,
        organizationId: seededOrganization.id,
        status: 'ACTIVE',
      },
      create: {
        isActive: true,
        organizationId: seededOrganization.id,
        sessionId: seededSession.id,
        status: 'ACTIVE',
        studentId: student.id,
      },
      select: { id: true },
    });

    for (const sessionCourse of sessionCourses) {
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
    }

    credentials.push({
      courses: courses.map((course) => course.name),
      email: studentInput.email,
      name: `${studentInput.firstName} ${studentInput.lastName}`,
      password: studentInput.password,
    });
  }

  console.log(JSON.stringify({ credentials }, null, 2));
  console.log(
    `Created/updated ${students.length} student accounts with ${courses.length} course assignments each.`,
  );
}

async function upsertCourse(courseInput: (typeof courses)[number]) {
  const existingCourse = await prisma.course.findFirst({
    where: {
      OR: [{ code: courseInput.code }, { name: courseInput.name }],
    },
    select: { id: true },
  });

  if (existingCourse) {
    return prisma.course.update({
      where: { id: existingCourse.id },
      data: {
        description: `${courseInput.name} for the IPMAT Foundation 2027 batch.`,
        isActive: true,
        status: CourseStatus.ACTIVE,
      },
      select: { id: true },
    });
  }

  return prisma.course.create({
    data: {
      code: courseInput.code,
      description: `${courseInput.name} for the IPMAT Foundation 2027 batch.`,
      isActive: true,
      name: courseInput.name,
      status: CourseStatus.ACTIVE,
    },
    select: { id: true },
  });
}

main()
  .catch((error: unknown) => {
    console.error('Student account seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
