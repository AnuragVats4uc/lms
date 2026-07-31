import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionCourseStatus } from '@prisma/client';

import { CreateSessionCourseDto } from '../dto/create-session-course.dto';
import { SessionCourseQueryDto } from '../dto/session-course-query.dto';
import { UpdateSessionCourseDto } from '../dto/update-session-course.dto';
import {
  NormalizedSessionCourseQuery,
  SessionCourseRepository,
  SessionCourseUpdateData,
  SessionCourseWithCourse,
} from '../repositories/session-course.repository';

@Injectable()
export class SessionCourseService {
  constructor(
    private readonly sessionCourseRepository: SessionCourseRepository,
  ) {}

  async create(sessionId: number, dto: CreateSessionCourseDto) {
    await this.ensureSessionExists(sessionId);
    await this.ensureCourseExists(dto.courseId);
    await this.ensureCourseAssignmentIsUnique(sessionId, dto.courseId);

    const sessionCourse = await this.sessionCourseRepository.create({
      ...dto,
      sessionId,
      status: dto.status ?? SessionCourseStatus.DRAFT,
    });

    return this.toResponse(sessionCourse);
  }

  async findAll(sessionId: number, query: SessionCourseQueryDto) {
    await this.ensureSessionExists(sessionId);

    const paginationQuery = this.normalizeQuery(query);
    const result = await this.sessionCourseRepository.findMany(
      sessionId,
      paginationQuery,
    );
    const totalPages = Math.ceil(result.total / paginationQuery.limit);

    return {
      items: result.items.map((sessionCourse) =>
        this.toResponse(sessionCourse),
      ),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  async findOne(sessionId: number, id: number) {
    await this.ensureSessionExists(sessionId);

    const sessionCourse = await this.findExisting(sessionId, id);

    return this.toResponse(sessionCourse);
  }

  async update(sessionId: number, id: number, dto: UpdateSessionCourseDto) {
    await this.ensureSessionExists(sessionId);
    await this.findExisting(sessionId, id);

    const sessionCourse = await this.sessionCourseRepository.update(
      id,
      this.toUpdateInput(dto),
    );

    return this.toResponse(sessionCourse);
  }

  async remove(sessionId: number, id: number) {
    await this.ensureSessionExists(sessionId);
    await this.findExisting(sessionId, id);

    const sessionCourse = await this.sessionCourseRepository.softDelete(id);

    return this.toResponse(sessionCourse);
  }

  private async ensureSessionExists(sessionId: number) {
    const session =
      await this.sessionCourseRepository.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }
  }

  private async ensureCourseExists(courseId: number) {
    const course = await this.sessionCourseRepository.findCourseById(courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }
  }

  private async findExisting(sessionId: number, id: number) {
    const sessionCourse = await this.sessionCourseRepository.findById(
      sessionId,
      id,
    );

    if (!sessionCourse) {
      throw new NotFoundException('SessionCourse not found');
    }

    return sessionCourse;
  }

  private async ensureCourseAssignmentIsUnique(
    sessionId: number,
    courseId: number,
  ) {
    const sessionCourse =
      await this.sessionCourseRepository.findBySessionAndCourse(
        sessionId,
        courseId,
      );

    if (sessionCourse) {
      throw new ConflictException('Course already assigned to this session');
    }
  }

  private normalizeQuery(
    query: SessionCourseQueryDto,
  ): NormalizedSessionCourseQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status ?? undefined,
    };
  }

  private toUpdateInput(dto: UpdateSessionCourseDto): SessionCourseUpdateData {
    const data: SessionCourseUpdateData = {};

    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return data;
  }

  private toResponse(sessionCourse: SessionCourseWithCourse) {
    return sessionCourse;
  }
}
