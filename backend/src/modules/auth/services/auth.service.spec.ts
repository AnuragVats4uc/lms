import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ActivitySessionEndReason,
  AuthenticationFailureReason,
  RefreshTokenRevocationReason,
  RefreshTokenStatus,
  UserStatus,
} from '@prisma/client';

import { ActivityService } from '../../activity/services/activity.service';
import { RolesService } from '../../roles/services/roles.service';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService activity lifecycle', () => {
  let authRepository: jest.Mocked<AuthRepository>;
  let configService: jest.Mocked<ConfigService>;
  let jwtService: jest.Mocked<JwtService>;
  let passwordService: jest.Mocked<PasswordService>;
  let rolesService: jest.Mocked<RolesService>;
  let activityService: jest.Mocked<ActivityService>;
  let service: AuthService;

  const user = {
    id: 10,
    uuid: 'b311ef24-0cc4-49c3-aac0-5c5323c53e7b',
    organizationId: 4,
    firstName: 'Student',
    lastName: 'One',
    email: 'student@example.com',
    password: 'password-hash',
    phone: null,
    status: UserStatus.ACTIVE,
    isActive: true,
    isVerified: true,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    student: { id: 20, organizationId: 4 },
  };
  const activitySession = {
    id: 30,
    uuid: 'f41f7278-eb0d-4e20-aa81-735af2c730e7',
    endedAt: null,
  };
  const storedToken = {
    id: 40,
    uuid: '9beb46ba-124c-461f-9b38-f07f52feb5c8',
    userId: user.id,
    userActivitySessionId: activitySession.id,
    token: 'refresh-hash',
    status: RefreshTokenStatus.ACTIVE,
    expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    revokedAt: null,
    revocationReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    userActivitySession: activitySession,
  };

  beforeEach(() => {
    authRepository = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      updateLastLoginAt: jest.fn(),
      createRefreshToken: jest.fn(),
      findActiveRefreshTokensByUserId: jest.fn(),
      revokeRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    passwordService = {
      compare: jest.fn(),
      hash: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;
    rolesService = {
      getUserAccessContext: jest.fn(),
    } as unknown as jest.Mocked<RolesService>;
    activityService = {
      recordFailedAuthentication: jest.fn(),
      startUserSession: jest.fn(),
      startUserSessionContinuation: jest.fn(),
      heartbeatUserSession: jest.fn(),
      endUserSession: jest.fn(),
    } as unknown as jest.Mocked<ActivityService>;

    service = new AuthService(
      authRepository,
      configService,
      jwtService,
      passwordService,
      rolesService,
      activityService,
    );
  });

  it('links a successful login and its refresh token to one activity session', async () => {
    authRepository.findUserByEmail.mockResolvedValue(user);
    authRepository.updateLastLoginAt.mockResolvedValue(user);
    authRepository.createRefreshToken.mockResolvedValue(storedToken);
    passwordService.compare.mockResolvedValue(true);
    passwordService.hash.mockResolvedValue('refresh-hash');
    rolesService.getUserAccessContext.mockResolvedValue({
      roles: ['STUDENT'],
      permissions: ['student.dashboard.read'],
    });
    activityService.startUserSession.mockResolvedValue(
      activitySession as never,
    );
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.login(
        { email: user.email, password: 'secret' },
        { ipAddress: '192.0.2.10', userAgent: 'Browser' },
      ),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      activitySessionUuid: activitySession.uuid,
    });
    expect(activityService.startUserSession.mock.calls[0][0]).toMatchObject({
      userId: user.id,
      attemptedEmail: user.email,
      ipAddress: '192.0.2.10',
    });
    expect(authRepository.createRefreshToken.mock.calls[0][3]).toBe(
      activitySession.id,
    );
    expect(jwtService.signAsync.mock.calls[0][0]).toMatchObject({
      activitySessionUuid: activitySession.uuid,
    });
  });

  it('records a missing-user login without revealing the reason to the caller', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    activityService.recordFailedAuthentication.mockResolvedValue({} as never);

    await expect(
      service.login({ email: 'missing@example.com', password: 'secret' }),
    ).rejects.toThrow('Invalid credentials');
    expect(
      activityService.recordFailedAuthentication.mock.calls[0][0],
    ).toMatchObject({
      attemptedEmail: 'missing@example.com',
      failureReason: AuthenticationFailureReason.USER_NOT_FOUND,
    });
  });

  it('records invalid passwords against the resolved user and student', async () => {
    authRepository.findUserByEmail.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(false);
    activityService.recordFailedAuthentication.mockResolvedValue({} as never);

    await expect(
      service.login({ email: user.email, password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(
      activityService.recordFailedAuthentication.mock.calls[0][0],
    ).toMatchObject({
      organizationId: user.organizationId,
      userId: user.id,
      studentId: user.student.id,
      failureReason: AuthenticationFailureReason.INVALID_PASSWORD,
    });
  });

  it('records blocked users distinctly', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      ...user,
      status: UserStatus.BLOCKED,
    });
    activityService.recordFailedAuthentication.mockResolvedValue({} as never);

    await expect(
      service.login({ email: user.email, password: 'secret' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(
      activityService.recordFailedAuthentication.mock.calls[0][0].failureReason,
    ).toBe(AuthenticationFailureReason.USER_BLOCKED);
  });

  it('rotates a refresh token without ending its open activity session', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: ['STUDENT'],
      activitySessionUuid: activitySession.uuid,
    });
    authRepository.findActiveRefreshTokensByUserId.mockResolvedValue([
      storedToken,
    ] as never);
    authRepository.findUserById.mockResolvedValue(user);
    authRepository.revokeRefreshToken.mockResolvedValue({ count: 1 });
    authRepository.createRefreshToken.mockResolvedValue(storedToken);
    passwordService.compare.mockResolvedValue(true);
    passwordService.hash.mockResolvedValue('next-refresh-hash');
    rolesService.getUserAccessContext.mockResolvedValue({
      roles: ['STUDENT'],
      permissions: [],
    });
    activityService.heartbeatUserSession.mockResolvedValue({} as never);
    jwtService.signAsync
      .mockResolvedValueOnce('next-access-token')
      .mockResolvedValueOnce('next-refresh-token');

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).resolves.toMatchObject({
      activitySessionUuid: activitySession.uuid,
    });
    expect(authRepository.revokeRefreshToken.mock.calls[0]).toEqual([
      storedToken.id,
      RefreshTokenRevocationReason.ROTATED,
    ]);
    expect(
      activityService.heartbeatUserSession.mock.calls[0].slice(0, 3),
    ).toEqual([activitySession.uuid, user.id, true]);
    expect(activityService.endUserSession.mock.calls).toHaveLength(0);
  });

  it('revokes on logout and closes the linked activity session', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: user.id,
      email: user.email,
      roles: ['STUDENT'],
    });
    authRepository.findActiveRefreshTokensByUserId.mockResolvedValue([
      storedToken,
    ] as never);
    authRepository.revokeRefreshToken.mockResolvedValue({ count: 1 });
    passwordService.compare.mockResolvedValue(true);
    activityService.endUserSession.mockResolvedValue({} as never);

    await expect(
      service.logout({ refreshToken: 'refresh-token' }),
    ).resolves.toEqual({ loggedOut: true });
    expect(authRepository.revokeRefreshToken.mock.calls[0]).toEqual([
      storedToken.id,
      RefreshTokenRevocationReason.MANUAL_LOGOUT,
    ]);
    expect(activityService.endUserSession.mock.calls[0][2]).toMatchObject({
      reason: ActivitySessionEndReason.MANUAL_LOGOUT,
      active: true,
    });
  });

  it('marks an expired refresh token and ends its linked session', async () => {
    jwtService.verifyAsync
      .mockRejectedValueOnce({ name: 'TokenExpiredError' })
      .mockResolvedValueOnce({
        sub: user.id,
        email: user.email,
        roles: ['STUDENT'],
      });
    authRepository.findActiveRefreshTokensByUserId.mockResolvedValue([
      storedToken,
    ] as never);
    authRepository.revokeRefreshToken.mockResolvedValue({ count: 1 });
    passwordService.compare.mockResolvedValue(true);
    activityService.endUserSession.mockResolvedValue({} as never);

    await expect(
      service.refresh({ refreshToken: 'expired-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(
      authRepository.findActiveRefreshTokensByUserId.mock.calls[0],
    ).toEqual([user.id, true]);
    expect(authRepository.revokeRefreshToken.mock.calls[0][1]).toBe(
      RefreshTokenRevocationReason.TOKEN_EXPIRED,
    );
    expect(activityService.endUserSession.mock.calls[0][2]).toMatchObject({
      reason: ActivitySessionEndReason.TOKEN_EXPIRED,
      active: false,
    });
  });
});
