import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { StudentsService } from '../students/students.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { Prisma, RefreshToken } from '@prisma/client';
import { AdminImpersonationService } from '../admin-impersonation/admin-impersonation.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly impersonationService: AdminImpersonationService,
  ) { }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
    const mobile = registerDto.mobile.trim();
    const firstName = registerDto.firstName.trim();
    const lastName = registerDto.lastName.trim();
    const name = `${firstName} ${lastName}`.trim();
    const className = registerDto.className.trim();
    const state = registerDto.state.trim();
    const city = registerDto.city.trim();
    const address = registerDto.address.trim();

    const existingEmailStudent =
      await this.studentsService.findByEmail(email);

    if (existingEmailStudent) {
      throw new ConflictException('Email is already registered');
    }

    const existingMobileStudent =
      await this.studentsService.findByMobile(mobile);

    if (existingMobileStudent) {
      throw new ConflictException('Mobile number is already registered');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.configService.get<number>('bcrypt.saltRounds')!,
    );

    try {
      const student = await this.studentsService.create({
        name,
        className,
        gender: registerDto.gender,
        email,
        mobile,
        password: hashedPassword,
        firstName,
        lastName,
        profile: {
          create: {
            addressLine1: address,
            city,
            country: 'India',
            state,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        student: this.studentsService.toPublicStudent(student),
        message: 'Registration successful',
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Student already exists');
      }

      throw error;
    }
  }

  private async generateRefreshToken(student: {
    id: bigint;
    email: string;
    role: string;
  }) {
    const payload = {
      sub: student.id.toString(),
      email: student.email,
      role: student.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<StringValue>('jwt.refreshExpiresIn'),
    });
  }

  async login(loginDto: LoginDto) {
    try {
      const student = await this.studentsService.findByEmail(loginDto.email);

      if (!student || !student.email || !student.password) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        student.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        sub: student.id.toString(),
        email: student.email,
        role: student.role,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      const refreshToken = await this.generateRefreshToken({
        id: student.id,
        email: student.email,
        role: student.role,
      });

      const hashedRefreshToken = await bcrypt.hash(
        refreshToken,
        this.configService.get<number>('bcrypt.saltRounds')!,
      );

      await this.refreshTokenRepository.create(
        student.id,
        hashedRefreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      return {
        student: this.studentsService.toPublicStudent(student),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // 1. Verify JWT first (signature check)
      const decoded = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const studentId = decoded.sub;

      // 2. Get student
      const student = await this.studentsService.findById(studentId);

      if (!student || !student.email) {
        throw new UnauthorizedException('Student not found');
      }

      // 3. Fetch all tokens for this student
      const storedTokens =
        await this.refreshTokenRepository.findAllByStudent(studentId);

      let matchedToken: RefreshToken | null = null;

      for (const dbToken of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, dbToken.token);

        if (isMatch) {
          matchedToken = dbToken;
          break;
        }
      }

      if (!matchedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 4. Delete OLD refresh token (ROTATION STEP 🔥)
      await this.refreshTokenRepository.deleteById(matchedToken.id);

      if (decoded.impersonation) {
        await this.impersonationService.assertActiveImpersonation(
          decoded.impersonation,
        );
      }

      // 5. Generate new tokens
      const payload = {
        sub: student.id.toString(),
        email: student.email,
        role: student.role,
        impersonation: decoded.impersonation,
      };

      const impersonationExpiresAt = decoded.impersonation
        ? new Date(decoded.impersonation.expiresAt)
        : null;
      const expiresInSeconds = impersonationExpiresAt
        ? Math.max(
            1,
            Math.floor(
              (impersonationExpiresAt.getTime() - Date.now()) /
                1000,
            ),
          )
        : null;

      const newAccessToken = await this.jwtService.signAsync(
        payload,
        expiresInSeconds
          ? {
              expiresIn: expiresInSeconds,
            }
          : undefined,
      );

      const newRefreshToken = decoded.impersonation
        ? await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>(
              'jwt.refreshSecret',
            ),
            expiresIn: expiresInSeconds ?? 1,
          })
        : await this.generateRefreshToken({
            id: student.id,
            email: student.email,
            role: student.role,
          });

      // 6. Hash new refresh token
      const hashedRefreshToken = await bcrypt.hash(
        newRefreshToken,
        this.configService.get<number>('bcrypt.saltRounds')!,
      );

      // 7. Save new refresh token
      await this.refreshTokenRepository.create(
        student.id,
        hashedRefreshToken,
        impersonationExpiresAt ??
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      // 8. Return new tokens
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const storedTokens = await this.refreshTokenRepository.findAll();

      let matchedTokenId: number | null = null;

      for (const dbToken of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, dbToken.token);

        if (isMatch) {
          matchedTokenId = dbToken.id;
          break;
        }
      }

      if (!matchedTokenId) {
        throw new UnauthorizedException('Invalid token');
      }

      await this.refreshTokenRepository.deleteById(matchedTokenId);

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Logout failed');
    }
  }
}
