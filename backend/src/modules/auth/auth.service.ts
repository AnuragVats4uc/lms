import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { StudentsService } from '../students/students.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  private async generateRefreshToken(student: {
    id: number;
    email: string;
    role: string;
  }) {
    console.log('REFRESH SECRET:', this.configService.get('jwt.refreshSecret'));

    console.log(
      'REFRESH EXPIRES:',
      this.configService.get('jwt.refreshExpiresIn'),
    );

    const payload = {
      sub: student.id,
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
        sub: student.id,
        email: student.email,
        role: student.role,
      };

      const accessToken = await this.jwtService.signAsync(payload);
      const refreshToken = await this.generateRefreshToken(student);

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
        student,
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
      const decoded = this.jwtService.verify(refreshToken, {
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

      // 5. Generate new tokens
      const payload = {
        sub: student.id,
        email: student.email,
      };

      const newAccessToken = await this.jwtService.signAsync(payload);

      const newRefreshToken = await this.generateRefreshToken(student);

      // 6. Hash new refresh token
      const hashedRefreshToken = await bcrypt.hash(
        newRefreshToken,
        this.configService.get<number>('bcrypt.saltRounds')!,
      );

      // 7. Save new refresh token
      await this.refreshTokenRepository.create(
        student.id,
        hashedRefreshToken,
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
