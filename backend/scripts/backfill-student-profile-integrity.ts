import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BackfillSummary {
  createdProfiles: number;
  filledProfileFields: number;
  linkedStudentOrganizations: number;
  linkedUserOrganizations: number;
  organizationConflicts: number;
}

async function main() {
  const students = await prisma.student.findMany({
    include: {
      enrollments: {
        where: { isActive: true },
        select: { organizationId: true },
      },
      profile: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          organizationId: true,
          phone: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  const summary: BackfillSummary = {
    createdProfiles: 0,
    filledProfileFields: 0,
    linkedStudentOrganizations: 0,
    linkedUserOrganizations: 0,
    organizationConflicts: 0,
  };

  for (const student of students) {
    const enrollmentOrganizationIds = [
      ...new Set(student.enrollments.map((item) => item.organizationId)),
    ];
    const inferredOrganizationId =
      student.organizationId ??
      student.user.organizationId ??
      (enrollmentOrganizationIds.length === 1
        ? enrollmentOrganizationIds[0]
        : null);

    if (
      student.organizationId &&
      student.user.organizationId &&
      student.organizationId !== student.user.organizationId
    ) {
      summary.organizationConflicts += 1;
    }

    const studentUpdate: Prisma.StudentUpdateInput = {};
    if (!student.organizationId && inferredOrganizationId) {
      studentUpdate.organization = { connect: { id: inferredOrganizationId } };
      summary.linkedStudentOrganizations += 1;
    }

    const userUpdate: Prisma.UserUpdateInput = {};
    if (!student.user.organizationId && inferredOrganizationId) {
      userUpdate.organization = { connect: { id: inferredOrganizationId } };
      summary.linkedUserOrganizations += 1;
    }

    const profileUpdate: Prisma.StudentProfileUpdateInput = {};
    if (student.profile) {
      if (!student.profile.firstName.trim() && student.user.firstName.trim()) {
        profileUpdate.firstName = student.user.firstName.trim();
        summary.filledProfileFields += 1;
      }
      if (!student.profile.lastName?.trim() && student.user.lastName?.trim()) {
        profileUpdate.lastName = student.user.lastName.trim();
        summary.filledProfileFields += 1;
      }
      if (!student.profile.phone?.trim() && student.user.phone?.trim()) {
        profileUpdate.phone = student.user.phone.trim();
        summary.filledProfileFields += 1;
      }
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(studentUpdate).length) {
        await tx.student.update({
          where: { id: student.id },
          data: studentUpdate,
        });
      }
      if (Object.keys(userUpdate).length) {
        await tx.user.update({
          where: { id: student.userId },
          data: userUpdate,
        });
      }
      if (!student.profile) {
        await tx.studentProfile.create({
          data: {
            studentId: student.id,
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            phone: student.user.phone,
          },
        });
        summary.createdProfiles += 1;
      } else if (Object.keys(profileUpdate).length) {
        await tx.studentProfile.update({
          where: { studentId: student.id },
          data: profileUpdate,
        });
      }
    });
  }

  console.log(
    `Student profile integrity backfill completed: ${JSON.stringify(summary)}`,
  );
  if (summary.organizationConflicts) {
    console.warn(
      'Organization conflicts were reported but left unchanged for manual review.',
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error('Student profile integrity backfill failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
