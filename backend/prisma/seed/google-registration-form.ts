import {
  CourseStatus,
  OrganizationStatus,
  PrismaClient,
  RegistrationPageStatus,
  SessionCourseStatus,
  SessionStatus,
} from '@prisma/client';

import { ensureOrganizationActivityPolicies } from './activity-policies';

const prisma = new PrismaClient();

const organizationSeed = {
  code: 'LMS-DEMO',
  name: 'LMS Demo Organization',
};

const sessionSeed = {
  code: 'IPMAT-2027',
  name: 'IPMAT Foundation 2027',
};

const educationOptions = [
  '12th Pass',
  'Undergraduate',
  'Graduate',
  'PG and above',
] as const;

const digitalLibraryLocations = ['Keonjhar City', 'Joda', 'Barbil'] as const;

const courseSeeds = [
  { name: 'SSC', code: 'SSC' },
  { name: 'Railways', code: 'RAILWAYS' },
  { name: 'Banking', code: 'BANKING' },
  { name: 'UPSC', code: 'UPSC' },
  { name: 'OPSC', code: 'OPSC' },
  { name: 'OSSSC', code: 'OSSSC' },
] as const;

async function main() {
  const organization = await prisma.organization.upsert({
    where: { code: organizationSeed.code },
    update: {
      name: organizationSeed.name,
      status: OrganizationStatus.ACTIVE,
      isActive: true,
    },
    create: {
      name: organizationSeed.name,
      code: organizationSeed.code,
      description: 'Demo organization for the student registration form.',
      status: OrganizationStatus.ACTIVE,
      isActive: true,
    },
    select: { id: true },
  });
  await ensureOrganizationActivityPolicies(prisma);

  const session = await prisma.session.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: sessionSeed.name,
      },
    },
    update: {
      code: sessionSeed.code,
      status: SessionStatus.ACTIVE,
      isActive: true,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.999Z'),
    },
    create: {
      organizationId: organization.id,
      name: sessionSeed.name,
      code: sessionSeed.code,
      description: 'Registration session for competitive exam preparation.',
      status: SessionStatus.ACTIVE,
      isActive: true,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.999Z'),
    },
    select: { id: true },
  });

  const sessionCourseIds: number[] = [];
  for (const [sortOrder, item] of courseSeeds.entries()) {
    const course = await prisma.course.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        status: CourseStatus.ACTIVE,
        isActive: true,
      },
      create: {
        name: item.name,
        code: item.code,
        description: `${item.name} exam preparation.`,
        status: CourseStatus.ACTIVE,
        isActive: true,
      },
      select: { id: true },
    });

    const sessionCourse = await prisma.sessionCourse.upsert({
      where: {
        sessionId_courseId: {
          sessionId: session.id,
          courseId: course.id,
        },
      },
      update: {
        displayName: item.name,
        description: `${item.name} preparation for ${sessionSeed.name}.`,
        sortOrder,
        isPublished: true,
        status: SessionCourseStatus.ACTIVE,
        isActive: true,
      },
      create: {
        sessionId: session.id,
        courseId: course.id,
        displayName: item.name,
        description: `${item.name} preparation for ${sessionSeed.name}.`,
        sortOrder,
        isPublished: true,
        status: SessionCourseStatus.ACTIVE,
        isActive: true,
      },
      select: { id: true },
    });
    sessionCourseIds.push(sessionCourse.id);
  }

  const educationOptionIds: number[] = [];
  for (const [sortOrder, name] of educationOptions.entries()) {
    const option = await prisma.organizationEducationOption.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name,
        },
      },
      update: { sortOrder, isActive: true },
      create: {
        organizationId: organization.id,
        name,
        sortOrder,
        isActive: true,
      },
      select: { id: true },
    });
    educationOptionIds.push(option.id);
  }

  const digitalLibraryLocationIds: number[] = [];
  for (const [sortOrder, name] of digitalLibraryLocations.entries()) {
    const location = await prisma.organizationDigitalLibraryLocation.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name,
        },
      },
      update: { sortOrder, isActive: true },
      create: {
        organizationId: organization.id,
        name,
        sortOrder,
        isActive: true,
      },
      select: { id: true },
    });
    digitalLibraryLocationIds.push(location.id);
  }

  const registrationPage = await prisma.organizationRegistrationPage.upsert({
    where: { slug: 'student-registration-form' },
    update: {
      organizationId: organization.id,
      sessionId: session.id,
      title: 'Student Registration Form',
      description: null,
      submitButtonText: 'Submit',
      successTitle: 'Registration Successful',
      successMessage: 'Your registration has been submitted successfully.',
      registrationEnabled: true,
      status: RegistrationPageStatus.ACTIVE,
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      sessionId: session.id,
      slug: 'student-registration-form',
      title: 'Student Registration Form',
      submitButtonText: 'Submit',
      successTitle: 'Registration Successful',
      successMessage: 'Your registration has been submitted successfully.',
      registrationEnabled: true,
      status: RegistrationPageStatus.ACTIVE,
      isActive: true,
    },
    select: { id: true, slug: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.organizationRegistrationPageCourse.deleteMany({
      where: { registrationPageId: registrationPage.id },
    });
    await tx.organizationRegistrationPageEducationOption.deleteMany({
      where: { registrationPageId: registrationPage.id },
    });
    await tx.organizationRegistrationPageDigitalLibraryLocation.deleteMany({
      where: { registrationPageId: registrationPage.id },
    });

    await tx.organizationRegistrationPageCourse.createMany({
      data: sessionCourseIds.map((sessionCourseId, sortOrder) => ({
        registrationPageId: registrationPage.id,
        sessionCourseId,
        sortOrder,
        isActive: true,
      })),
    });
    await tx.organizationRegistrationPageEducationOption.createMany({
      data: educationOptionIds.map((educationOptionId, sortOrder) => ({
        registrationPageId: registrationPage.id,
        educationOptionId,
        sortOrder,
        isActive: true,
      })),
    });
    await tx.organizationRegistrationPageDigitalLibraryLocation.createMany({
      data: digitalLibraryLocationIds.map(
        (digitalLibraryLocationId, sortOrder) => ({
          registrationPageId: registrationPage.id,
          digitalLibraryLocationId,
          sortOrder,
          isActive: true,
        }),
      ),
    });
  });

  console.log(`Created registration form: /register/${registrationPage.slug}`);
}

main()
  .catch((error: unknown) => {
    console.error('Google registration form seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
