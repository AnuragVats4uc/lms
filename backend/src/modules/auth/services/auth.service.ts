import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ActivitySessionEndReason,
  AuthenticationFailureReason,
  RefreshTokenRevocationReason,
  User,
  UserStatus,
} from '@prisma/client';

import { ActivityService } from '../../activity/services/activity.service';
import { ActivityRequestMetadata } from '../../activity/types/activity.types';
import { RolesService } from '../../roles/services/roles.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthRepository } from '../repositories/auth.repository';
import { PasswordService } from './password.service';
import { parseTokenDurationSeconds } from '../utils/token-duration';

type ActivitySessionContext = {
  id: number;
  uuid: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthRepository)
    private readonly authRepository: AuthRepository,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(PasswordService)
    private readonly passwordService: PasswordService,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
    @Inject(ActivityService)
    private readonly activityService: ActivityService,
  ) {}

  async login(dto: LoginDto, metadata: ActivityRequestMetadata = {}) {
    const user = await this.validateUser(dto.email, dto.password, metadata);
    await this.authRepository.updateLastLoginAt(user.id);

    const activitySession = await this.activityService.startUserSession({
      userId: user.id,
      attemptedEmail: dto.email,
      ...metadata,
    });

    try {
      return await this.buildAuthResponse(user, activitySession);
    } catch (error) {
      await this.activityService.endUserSession(activitySession.uuid, user.id, {
        reason: ActivitySessionEndReason.UNKNOWN,
        active: false,
      });
      throw error;
    }
  }

  async refresh(dto: RefreshTokenDto, metadata: ActivityRequestMetadata = {}) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const storedToken = await this.findMatchingRefreshToken(
      payload.sub,
      dto.refreshToken,
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user || !this.isLoginAllowed(user)) {
      const revoked = await this.authRepository.revokeRefreshToken(
        storedToken.id,
        RefreshTokenRevocationReason.ACCOUNT_DISABLED,
      );
      if (revoked.count === 1) {
        await this.endLinkedActivitySession(
          storedToken,
          payload.sub,
          ActivitySessionEndReason.ACCOUNT_DISABLED,
        );
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const revoked = await this.authRepository.revokeRefreshToken(
      storedToken.id,
      RefreshTokenRevocationReason.ROTATED,
    );
    if (revoked.count !== 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const activitySession = await this.continueActivitySession(
      user,
      storedToken,
      metadata,
    );
    return this.buildAuthResponse(user, activitySession);
  }

  async logout(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const storedToken = await this.findMatchingRefreshToken(
      payload.sub,
      dto.refreshToken,
    );

    if (storedToken) {
      const revoked = await this.authRepository.revokeRefreshToken(
        storedToken.id,
        RefreshTokenRevocationReason.MANUAL_LOGOUT,
      );
      if (revoked.count === 1) {
        await this.endLinkedActivitySession(
          storedToken,
          payload.sub,
          ActivitySessionEndReason.MANUAL_LOGOUT,
        );
      }
    }

    return { loggedOut: true };
  }

  private async validateUser(
    email: string,
    password: string,
    metadata: ActivityRequestMetadata,
  ) {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      await this.activityService.recordFailedAuthentication({
        attemptedEmail: email,
        failureReason: AuthenticationFailureReason.USER_NOT_FOUND,
        ...metadata,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.isLoginAllowed(user)) {
      await this.activityService.recordFailedAuthentication({
        organizationId: user.organizationId ?? user.student?.organizationId,
        userId: user.id,
        studentId: user.student?.id,
        attemptedEmail: email,
        failureReason:
          user.status === UserStatus.BLOCKED
            ? AuthenticationFailureReason.USER_BLOCKED
            : AuthenticationFailureReason.USER_INACTIVE,
        ...metadata,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.activityService.recordFailedAuthentication({
        organizationId: user.organizationId ?? user.student?.organizationId,
        userId: user.id,
        studentId: user.student?.id,
        attemptedEmail: email,
        failureReason: AuthenticationFailureReason.INVALID_PASSWORD,
        ...metadata,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private isLoginAllowed(user: User) {
    return user.isActive && user.status === UserStatus.ACTIVE;
  }

  private async buildAuthResponse(
    user: User,
    activitySession: ActivitySessionContext,
  ) {
    const accessContext = await this.rolesService.getUserAccessContext(user.id);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: accessContext.roles,
      activitySessionUuid: activitySession.uuid,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.signRefreshToken(payload);
    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    await this.authRepository.createRefreshToken(
      user.id,
      refreshTokenHash,
      this.getRefreshTokenExpiresAt(),
      activitySession.id,
    );

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationId: user.organizationId,
        roles: accessContext.roles,
        permissions: accessContext.permissions,
      },
      accessToken,
      refreshToken,
      activitySessionUuid: activitySession.uuid,
    };
  }

  private async continueActivitySession(
    user: User,
    storedToken: Awaited<
      ReturnType<AuthRepository['findActiveRefreshTokensByUserId']>
    >[number],
    metadata: ActivityRequestMetadata,
  ): Promise<ActivitySessionContext> {
    const linkedSession = storedToken.userActivitySession;
    if (linkedSession && !linkedSession.endedAt) {
      try {
        await this.activityService.heartbeatUserSession(
          linkedSession.uuid,
          user.id,
          true,
        );
        return linkedSession;
      } catch (error) {
        if (
          !(error instanceof NotFoundException) &&
          !(error instanceof ConflictException)
        ) {
          throw error;
        }
      }
    }

    return this.activityService.startUserSessionContinuation({
      userId: user.id,
      ...metadata,
    });
  }

  private async endLinkedActivitySession(
    storedToken: Awaited<
      ReturnType<AuthRepository['findActiveRefreshTokensByUserId']>
    >[number],
    userId: number,
    reason: ActivitySessionEndReason,
  ) {
    if (!storedToken.userActivitySession?.uuid) return;
    await this.activityService.endUserSession(
      storedToken.userActivitySession.uuid,
      userId,
      { reason, active: reason === ActivitySessionEndReason.MANUAL_LOGOUT },
    );
  }

  private signRefreshToken(payload: JwtPayload) {
    const refreshSecret = this.getRefreshSecret();

    return this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.getRefreshExpiresInSeconds(),
    });
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch (error) {
      if (this.isExpiredJwtError(error)) {
        await this.expireStoredRefreshToken(refreshToken);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async expireStoredRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.getRefreshSecret(),
          ignoreExpiration: true,
        },
      );
      const storedToken = await this.findMatchingRefreshToken(
        payload.sub,
        refreshToken,
        true,
      );
      if (!storedToken) return;

      const revoked = await this.authRepository.revokeRefreshToken(
        storedToken.id,
        RefreshTokenRevocationReason.TOKEN_EXPIRED,
      );
      if (revoked.count === 1) {
        await this.endLinkedActivitySession(
          storedToken,
          payload.sub,
          ActivitySessionEndReason.TOKEN_EXPIRED,
        );
      }
    } catch {
      return;
    }
  }

  private async findMatchingRefreshToken(
    userId: number,
    refreshToken: string,
    includeExpired = false,
  ) {
    const tokens = await this.authRepository.findActiveRefreshTokensByUserId(
      userId,
      includeExpired,
    );

    for (const token of tokens) {
      const isMatch = await this.passwordService.compare(
        refreshToken,
        token.token,
      );

      if (isMatch) return token;
    }

    return null;
  }

  private isExpiredJwtError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TokenExpiredError'
    );
  }

  private getRefreshSecret() {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    return refreshSecret;
  }

  private getRefreshExpiresInSeconds() {
    return parseTokenDurationSeconds(
      this.configService.get<string>('jwt.refreshExpiresIn'),
      '7d',
    );
  }

  private getRefreshTokenExpiresAt() {
    return new Date(Date.now() + this.getRefreshExpiresInSeconds() * 1000);
  }
}
