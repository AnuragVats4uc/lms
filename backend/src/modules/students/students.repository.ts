import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class StudentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.students.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.students.findUnique({
      where: {
        id,
      },
    });
  }

  async updateLastLogin(id: number) {
    return this.prisma.students.update({
      where: {
        id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}