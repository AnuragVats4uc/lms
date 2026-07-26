import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '@prisma/client';
import ms, { StringValue } from 'ms';

import { RolesService } from '../../roles/services/roles.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthRepository } from '../repositories/auth.repository';
import { PasswordService } from './password.service';

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
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    await this.authRepository.updateLastLoginAt(user.id);

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.authRepository.findUserById(payload.sub);

    if (!user || !this.isLoginAllowed(user)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.findMatchingRefreshToken(
      user.id,
      dto.refreshToken,
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.authRepository.revokeRefreshToken(storedToken.id);

    return this.buildAuthResponse(user);
  }

  async logout(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const storedToken = await this.findMatchingRefreshToken(
      payload.sub,
      dto.refreshToken,
    );

    if (storedToken) {
      await this.authRepository.revokeRefreshToken(storedToken.id);
    }

    return { loggedOut: true };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user || !this.isLoginAllowed(user)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private isLoginAllowed(user: User) {
    return user.isActive && user.status === UserStatus.ACTIVE;
  }

  private async buildAuthResponse(user: User) {
    const accessContext =
      await this.rolesService.getUserAccessContext(user.id);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: accessContext.roles,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.signRefreshToken(payload);
    const refreshTokenHash =
      await this.passwordService.hash(refreshToken);

    await this.authRepository.createRefreshToken(
      user.id,
      refreshTokenHash,
      this.getRefreshTokenExpiresAt(),
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
    };
  }

  private signRefreshToken(payload: JwtPayload) {
    const refreshSecret = this.getRefreshSecret();

    return this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.getRefreshExpiresIn(),
    });
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.getRefreshSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async findMatchingRefreshToken(
    userId: number,
    refreshToken: string,
  ) {
    const tokens =
      await this.authRepository.findActiveRefreshTokensByUserId(
        userId,
      );

    for (const token of tokens) {
      const isMatch = await this.passwordService.compare(
        refreshToken,
        token.token,
      );

      if (isMatch) {
        return token;
      }
    }

    return null;
  }

  private getRefreshSecret() {
    const refreshSecret = this.configService.get<string>(
      'jwt.refreshSecret',
    );

    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    return refreshSecret;
  }

  private getRefreshExpiresIn() {
    return (
      this.configService.get<StringValue>('jwt.refreshExpiresIn') ??
      '7d'
    );
  }

  private getRefreshTokenExpiresAt() {
    const duration = ms(this.getRefreshExpiresIn());

    if (typeof duration !== 'number') {
      throw new Error('Invalid JWT refresh expiration');
    }

    return new Date(Date.now() + duration);
  }
}
