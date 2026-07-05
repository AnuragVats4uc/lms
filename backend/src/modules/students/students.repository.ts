import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class StudentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.students.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.students.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async updateLastLogin(id: number) {
    return this.prisma.students.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async saveRefreshToken(
    studentId: number,
    token: string,
    expiresAt: Date,
  ) {
    return this.prisma.refreshToken.create({
      data: {
        studentId,
        token,
        expiresAt,
      },
    });
  }
}