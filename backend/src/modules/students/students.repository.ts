import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  async findByMobile(mobile: string) {
    return this.prisma.students.findUnique({
      where: { mobile },
      include: {
        profile: true,
      },
    });
  }

  async findById(id: bigint | string) {
    return this.prisma.students.findUnique({
      where: { id: BigInt(id) },
      include: {
        profile: true,
      },
    });
  }

  async updateLastLogin(id: bigint | string) {
    return this.prisma.students.update({
      where: { id: BigInt(id) },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async saveRefreshToken(
    studentId: bigint | string,
    token: string,
    expiresAt: Date,
  ) {
    return this.prisma.refreshToken.create({
      data: {
        studentId: BigInt(studentId),
        token,
        expiresAt,
      },
    });
  }

  async create(data: Prisma.StudentsCreateInput) {
    return this.prisma.students.create({
      data,
      include: {
        profile: true,
      },
    });
  }
}
