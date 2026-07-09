import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: bigint | string, token: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: {
        studentId: BigInt(studentId),
        token,
        expiresAt,
      },
    });
  }

  async findAll() {
    return this.prisma.refreshToken.findMany();
  }

  async deleteAllByStudentId(studentId: bigint | string) {
    return this.prisma.refreshToken.deleteMany({
      where: {
        studentId: BigInt(studentId),
      },
    });
  }

  async findAllByStudent(studentId: bigint | string) {
    return this.prisma.refreshToken.findMany({
      where: { studentId: BigInt(studentId) },
    });
  }

  async deleteById(id: number) {
    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }
  
}
