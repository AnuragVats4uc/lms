import { ConflictException } from '@nestjs/common';
import { RegistrationService } from './registration.service';

describe('Public registration account safety', () => {
  const account = { email: 'new@example.com', password: 'hashed-password' };
  const page = { organizationId: 1 };
  const dto = { firstName: 'Student', phone: '9999999999' };
  const service = Object.create(RegistrationService.prototype) as {
    findOrCreateRegistrationUser: (tx: unknown, page: unknown, dto: unknown, account: unknown) => Promise<unknown>;
  };
  it.each(['email', 'phone'])('rejects an existing %s without modifying the account', async (match) => {
    const tx = { user: {
      findUnique: jest.fn().mockResolvedValueOnce(match === 'email' ? { id: 1 } : null).mockResolvedValueOnce(match === 'phone' ? { id: 1 } : null),
      create: jest.fn(), update: jest.fn(),
    } };
    await expect(service.findOrCreateRegistrationUser(tx, page, dto, account)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it('creates a new account with the submitted email and hashed password', async () => {
    const tx = { user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 2 }), update: jest.fn() } };
    await service.findOrCreateRegistrationUser(tx, page, dto, account);
    expect(tx.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: account.email, password: account.password, phone: dto.phone, organizationId: page.organizationId }) });
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
