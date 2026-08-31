import { ForbiddenException } from '@nestjs/common';

import type { CurrentUser } from '../../auth/types/current-user.types';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationService } from './organization.service';

const admin: CurrentUser = {
  userId: 2,
  email: 'admin@example.com',
  organizationId: 7,
  roles: ['ADMIN'],
};

const superAdmin: CurrentUser = {
  userId: 1,
  email: 'superadmin@example.com',
  organizationId: null,
  roles: ['SUPER_ADMIN'],
};

describe('OrganizationService organization scope', () => {
  const repository = {
    create: jest.fn(),
    findByCode: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    findMany: jest.fn(),
  } as unknown as jest.Mocked<OrganizationRepository>;
  const service = new OrganizationService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('limits an Admin organization list to their own organization', async () => {
    repository.findMany.mockResolvedValue({ items: [], total: 0 });
    await service.findAll({ page: 1, limit: 10 }, admin);
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 7 }),
    );
  });

  it('does not constrain a SuperAdmin organization list', async () => {
    repository.findMany.mockResolvedValue({ items: [], total: 0 });
    await service.findAll({ page: 1, limit: 10 }, superAdmin);
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: undefined }),
    );
  });

  it('prevents an Admin from accessing another organization', async () => {
    await expect(service.findOne(8, admin)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('allows only a SuperAdmin to create an organization', async () => {
    await expect(
      service.create({ name: 'Other' }, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
