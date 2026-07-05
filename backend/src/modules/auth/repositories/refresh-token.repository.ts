import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: number, token: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: {
        studentId,
        token,
        expiresAt,
      },
    });
  }

  async findAll() {
    return this.prisma.refreshToken.findMany();
  }

  async deleteAllByStudentId(studentId: number) {
    return this.prisma.refreshToken.deleteMany({
      where: {
        studentId,
      },
    });
  }

  async findAllByStudent(studentId: number) {
    return this.prisma.refreshToken.findMany({
      where: { studentId },
    });
  }

  async deleteById(id: number) {
    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }
  
}
