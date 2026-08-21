import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma';

/**
 * Database boundary for the exam aggregate. Keeping the client behind this
 * provider makes the large transactional aggregate mockable without exposing
 * Prisma from the module itself.
 */
@Injectable()
export class ExamRepository {
  constructor(private readonly prismaService: PrismaService) {}

  get client(): PrismaService {
    return this.prismaService;
  }
}
