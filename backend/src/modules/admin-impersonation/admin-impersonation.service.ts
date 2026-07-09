import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { StringValue } from 'ms';

import { PrismaService } from '../../prisma';
import { StudentsService } from '../students/students.service';
import { StartImpersonationDto } from './dto/start-impersonation.dto';
import { AdminImpersonationRepository } from './admin-impersonation.repository';
import {
  AuthenticatedRequestUser,
  ImpersonationJwtPayload,
  ImpersonationLogRow,
} from './types/impersonation.types';

interface RequestAuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

const IMPERSONATION_ROLES = new Set([
  'ADMIN',
  'SUPER_ADMIN',
  'SUPPORT',
]);

const IMPERSONATION_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AdminImpersonationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly impersonationRepository: AdminImpersonationRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly studentsService: StudentsService,
  ) {}

  async start(
    admin: AuthenticatedRequestUser,
    studentId: string,
    dto: StartImpersonationDto,
    auditContext: RequestAuditContext,
  ) {
    this.assertCanImpersonate(admin);

    const [adminUser, student] = await Promise.all([
      this.studentsService.findById(admin.studentId),
      this.studentsService.findById(studentId),
    ]);

    if (!adminUser) {
      throw new UnauthorizedException('Admin account not found');
    }

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.role !== 'STUDENT') {
      throw new ForbiddenException(
        'Only student accounts can be impersonated',
      );
    }

    const now = Date.now();
    const expiresAt = new Date(now + IMPERSONATION_TTL_MS);
    const logId = randomUUID();
    const tokenId = randomUUID();

    await this.impersonationRepository.createLog({
      adminUserId: BigInt(admin.studentId),
      expiresAt,
      id: logId,
      ipAddress: auditContext.ipAddress ?? null,
      reason: dto.reason?.trim() || null,
      studentId: student.id,
      tokenId,
      userAgent: auditContext.userAgent ?? null,
    });

    if (!student.email) {
      throw new ForbiddenException(
        'Student account does not have an email login',
      );
    }

    const impersonation: ImpersonationJwtPayload = {
      adminUserId: admin.studentId,
      expiresAt: expiresAt.toISOString(),
      logId,
      studentId: student.id.toString(),
      tokenId,
    };

    const accessToken = await this.jwtService.signAsync(
      {
        sub: student.id.toString(),
        email: student.email,
        role: student.role,
        impersonation,
      },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: '1h',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: student.id.toString(),
        email: student.email,
        role: student.role,
        impersonation,
      },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: '1h' as StringValue,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      this.configService.get<number>('bcrypt.saltRounds')!,
    );

    await this.prisma.refreshToken.create({
      data: {
        studentId: student.id,
        token: hashedRefreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      redirectUrl: '/dashboard',
      student: this.studentsService.toPublicStudent(student),
      impersonation: this.toPublicLog(
        (await this.impersonationRepository.findById(logId))!,
      ),
    };
  }

  async stop(user: AuthenticatedRequestUser) {
    const impersonation = this.requireImpersonation(user);

    const log =
      await this.impersonationRepository.endActiveLog(
        impersonation.logId,
        impersonation.tokenId,
      );

    return {
      isImpersonating: false,
      impersonation: log ? this.toPublicLog(log) : null,
      message: 'Impersonation stopped',
    };
  }

  async current(user: AuthenticatedRequestUser) {
    if (!user.impersonation) {
      return {
        isImpersonating: false,
      };
    }

    const log =
      await this.impersonationRepository.findActiveByToken(
        user.impersonation.logId,
        user.impersonation.tokenId,
      );

    if (!log) {
      return {
        isImpersonating: false,
      };
    }

    const student = await this.studentsService.findById(
      user.impersonation.studentId,
    );

    return {
      isImpersonating: true,
      adminUserId: log.adminUserId.toString(),
      studentId: log.studentId.toString(),
      studentName: student
        ? this.getStudentName(student)
        : undefined,
      startedAt: log.startedAt,
      expiresAt: log.expiresAt,
      reason: log.reason,
    };
  }

  async assertActiveImpersonation(
    impersonation: ImpersonationJwtPayload,
  ) {
    const log =
      await this.impersonationRepository.findActiveByToken(
        impersonation.logId,
        impersonation.tokenId,
      );

    if (!log) {
      throw new UnauthorizedException(
        'Impersonation session is no longer active',
      );
    }
  }

  private assertCanImpersonate(user: AuthenticatedRequestUser) {
    const role = user.role?.toUpperCase();

    if (!role || !IMPERSONATION_ROLES.has(role)) {
      throw new ForbiddenException(
        'You do not have permission to impersonate students',
      );
    }
  }

  private requireImpersonation(user: AuthenticatedRequestUser) {
    if (!user.impersonation) {
      throw new ForbiddenException(
        'No active impersonation session found',
      );
    }

    return user.impersonation;
  }

  private toPublicLog(log: ImpersonationLogRow) {
    return {
      id: log.id,
      adminUserId: log.adminUserId.toString(),
      studentId: log.studentId.toString(),
      tokenId: log.tokenId,
      reason: log.reason,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      expiresAt: log.expiresAt,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }

  private getStudentName(student: {
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
  }) {
    const fullName = [
      student.firstName,
      student.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || student.name || '';
  }
}
