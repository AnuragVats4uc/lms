import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StudentLandingCardType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/services/activity.service';
import { ManagedObjectService } from '../storage/managed-object.service';
import { StudentLandingService } from './student-landing.service';

describe('StudentLandingService', () => {
  const systemCard = {
    id: 1,
    uuid: '11111111-1111-4111-8111-111111111111',
    organizationId: 7,
    type: StudentLandingCardType.SYSTEM_LMS,
    systemKey: 'LMS',
    title: 'LMS',
    description: 'Dashboard',
    ctaLabel: 'Open',
    destinationUrl: '/student/dashboard',
    imageUrl: null,
    imageAlt: null,
    openInNewTab: false,
    displayOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  function createService() {
    const prisma = {
      studentLandingCard: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      student: { findUnique: jest.fn() },
      userActivitySession: { findFirst: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;
    const activity = {
      recordStudentEvent: jest.fn(),
    } as unknown as jest.Mocked<ActivityService>;
    const managedObjects = {
      delete: jest.fn(),
      open: jest.fn(),
      upload: jest.fn(),
    } as unknown as jest.Mocked<ManagedObjectService>;
    return {
      activity,
      managedObjects,
      prisma,
      service: new StudentLandingService(prisma, activity, managedObjects),
    };
  }

  it('keeps the system LMS destination, order, and visibility immutable', async () => {
    const { prisma, service } = createService();
    prisma.studentLandingCard.findFirst = jest
      .fn()
      .mockResolvedValue(systemCard);
    prisma.studentLandingCard.update = jest.fn().mockResolvedValue(systemCard);

    await service.update(
      {
        userId: 2,
        email: 'admin@example.com',
        organizationId: 7,
        roles: ['ADMIN'],
      },
      1,
      {
        title: 'Learning portal',
        destinationUrl: 'https://unexpected.example.com',
        isActive: false,
        openInNewTab: true,
      },
    );

    expect(prisma.studentLandingCard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          destinationUrl: '/student/dashboard',
          displayOrder: 0,
          isActive: true,
          openInNewTab: false,
        }),
      }),
    );
  });

  it('does not allow the system LMS card to be deleted', async () => {
    const { prisma, service } = createService();
    prisma.studentLandingCard.findFirst = jest
      .fn()
      .mockResolvedValue(systemCard);

    await expect(
      service.remove(
        {
          userId: 2,
          email: 'admin@example.com',
          organizationId: 7,
          roles: ['ADMIN'],
        },
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects student access when no student profile exists', async () => {
    const { prisma, service } = createService();
    prisma.student.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.listForStudent({
        userId: 10,
        email: 'user@example.com',
        organizationId: 7,
        roles: ['STUDENT'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
