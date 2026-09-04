import { RegistrationPageStatus } from '@prisma/client';

import { RegistrationService } from './registration.service';

describe('RegistrationService course interests', () => {
  it('stores selected courses as interests and enrolls every eligible session course', async () => {
    const tx = {
      studentEnrollment: {
        upsert: jest.fn().mockResolvedValue({ id: 41 }),
      },
      studentCourseEnrollment: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn().mockResolvedValue({}),
      },
      studentCourseInterest: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn().mockResolvedValue({}),
      },
      studentProfile: {
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        async (operation: (client: typeof tx) => Promise<unknown>) =>
          operation(tx),
      ),
    };
    const passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
    };
    const service = new RegistrationService(
      prisma as never,
      passwordService as never,
    );
    const page = {
      id: 5,
      organizationId: 2,
      sessionId: 9,
      registrationEnabled: true,
      isActive: true,
      status: RegistrationPageStatus.ACTIVE,
      successTitle: 'Registration Successful',
      successMessage: 'Your account is ready.',
      fields: [],
      organization: {
        isActive: true,
        status: 'ACTIVE',
        name: 'Keonjhar Digital Library',
      },
      session: {
        isActive: true,
        status: 'ACTIVE',
        name: '2026-2027',
      },
    };
    const interestedCourse = {
      id: 101,
      uuid: '00000000-0000-4000-8000-000000000101',
      displayName: null,
      course: { id: 1, code: 'HISTORY', name: 'History' },
    };
    const allEligibleCourses = [
      interestedCourse,
      {
        id: 102,
        uuid: '00000000-0000-4000-8000-000000000102',
        displayName: null,
        course: { id: 2, code: 'GEOGRAPHY', name: 'Geography' },
      },
    ];

    jest
      .spyOn(service as never, 'findPageBySlug' as never)
      .mockResolvedValue(page as never);
    jest
      .spyOn(service as never, 'findSelectedSessionCourses' as never)
      .mockResolvedValue([interestedCourse] as never);
    jest
      .spyOn(service as never, 'findEligibleSessionCourses' as never)
      .mockResolvedValue(allEligibleCourses as never);
    jest
      .spyOn(service as never, 'findConfiguredEducationOption' as never)
      .mockResolvedValue({ uuid: 'education-uuid' } as never);
    jest
      .spyOn(service as never, 'findConfiguredDigitalLibraryLocation' as never)
      .mockResolvedValue({ uuid: 'library-uuid' } as never);
    jest
      .spyOn(service as never, 'findOrCreateRegistrationUser' as never)
      .mockResolvedValue({ id: 12 } as never);
    jest
      .spyOn(service as never, 'findOrCreateStudent' as never)
      .mockResolvedValue({
        id: 23,
        uuid: '00000000-0000-4000-8000-000000000023',
      } as never);
    jest
      .spyOn(service as never, 'assignStudentRole' as never)
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(service as never, 'saveRegistrationMasterAnswers' as never)
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(service as never, 'saveCustomRegistrationAnswers' as never)
      .mockResolvedValue(undefined as never);

    const result = await service.submitPublicRegistration('keonjhar', {
      firstName: 'Demo',
      lastName: 'Student',
      gender: 'MALE',
      dateOfBirth: '2005-01-01',
      phone: '9999999999',
      email: 'demo@example.com',
      password: 'Student@123',
      educationOptionUuid: '00000000-0000-4000-8000-000000000201',
      digitalLibraryLocationUuid: '00000000-0000-4000-8000-000000000202',
      selectedSessionCourseUuids: [interestedCourse.uuid],
    });

    expect(tx.studentCourseEnrollment.updateMany).toHaveBeenCalledWith({
      where: {
        enrollmentId: 41,
        sessionCourseId: { notIn: [101, 102] },
      },
      data: {
        isActive: false,
        status: 'CANCELLED',
      },
    });
    expect(tx.studentCourseEnrollment.upsert).toHaveBeenCalledTimes(2);
    expect(tx.studentCourseInterest.upsert).toHaveBeenCalledTimes(1);
    expect(tx.studentCourseInterest.upsert).toHaveBeenCalledWith({
      where: {
        studentId_sessionCourseId: {
          studentId: 23,
          sessionCourseId: 101,
        },
      },
      create: {
        studentId: 23,
        sessionCourseId: 101,
        registrationPageId: 5,
      },
      update: {
        registrationPageId: 5,
      },
    });
    expect(result.selectedCourses).toEqual([
      {
        uuid: interestedCourse.uuid,
        name: 'History',
      },
    ]);
  });
});
