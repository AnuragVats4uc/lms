import { StudentDashboardBannerMediaType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/types/current-user.types';
import { ManagedObjectService } from '../storage/managed-object.service';
import { StudentDashboardBannerService } from './student-dashboard-banner.service';

describe('StudentDashboardBannerService autoplay', () => {
  const actor = {
    userId: 1,
    email: 'admin@example.com',
    roles: ['SUPER_ADMIN'],
  } as CurrentUser;

  const createService = () => {
    const create = jest.fn().mockImplementation(({ data }) => data);
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ id: 7 }),
      },
      session: {
        count: jest.fn().mockResolvedValue(1),
      },
      studentDashboardBanner: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _max: { displayOrder: null } }),
        create,
      },
    } as unknown as PrismaService;
    const managedObjects = {} as ManagedObjectService;
    return {
      create,
      service: new StudentDashboardBannerService(prisma, managedObjects),
    };
  };

  it('persists autoplay for video banners', async () => {
    const { create, service } = createService();

    await service.create(actor, 7, {
      title: 'Introduction',
      mediaType: StudentDashboardBannerMediaType.VIDEO,
      mediaUrl: 'https://cdn.example.com/introduction.mp4',
      sessionIds: [3],
      autoplay: true,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          autoplay: true,
          videoProvider: 'DIRECT',
        }),
      }),
    );
  });

  it('forces autoplay off for image banners', async () => {
    const { create, service } = createService();

    await service.create(actor, 7, {
      title: 'Course guide',
      mediaType: StudentDashboardBannerMediaType.IMAGE,
      mediaUrl: '/images/course-guide.webp',
      sessionIds: [3],
      autoplay: true,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          autoplay: false,
          videoProvider: null,
        }),
      }),
    );
  });
});
