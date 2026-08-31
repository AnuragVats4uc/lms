import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course, CourseStatus } from '@prisma/client';

import { CourseQueryDto } from '../dto/course-query.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import {
  CourseRepository,
  CourseUpdateData,
  NormalizedCourseQuery,
} from '../repositories/course.repository';
import { generateInternalCode } from '../../../common/utils/internal-code';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async create(dto: CreateCourseDto) {
    await this.ensureNameIsUnique(dto.name);
    const code = await generateInternalCode({
      fallback: 'COURSE',
      isTaken: async (candidate) =>
        Boolean(await this.courseRepository.findByCode(candidate)),
      maxLength: 30,
      source: dto.name,
    });

    const course = await this.courseRepository.create({
      ...dto,
      code,
      status: dto.status ?? CourseStatus.DRAFT,
    });

    return this.toResponse(course);
  }

  async findAll(query: CourseQueryDto) {
    const paginationQuery = this.normalizeQuery(query);
    const result = await this.courseRepository.findMany(paginationQuery);
    const totalPages = Math.ceil(result.total / paginationQuery.limit);

    return {
      items: result.items.map((course) => this.toResponse(course)),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const course = await this.findExisting(id);

    return this.toResponse(course);
  }

  async update(id: number, dto: UpdateCourseDto) {
    await this.findExisting(id);

    if (dto.name) {
      await this.ensureNameIsUnique(dto.name, id);
    }

    const course = await this.courseRepository.update(
      id,
      this.toUpdateInput(dto),
    );

    return this.toResponse(course);
  }

  async remove(id: number) {
    await this.findExisting(id);

    const course = await this.courseRepository.softDelete(id);

    return this.toResponse(course);
  }

  private async findExisting(id: number) {
    const course = await this.courseRepository.findById(id);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  private async ensureNameIsUnique(name: string, excludeId?: number) {
    const course = excludeId
      ? await this.courseRepository.findByNameExcludingId(name, excludeId)
      : await this.courseRepository.findByName(name);

    if (course) {
      throw new ConflictException('Course name already exists');
    }
  }

  private normalizeQuery(query: CourseQueryDto): NormalizedCourseQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status ?? undefined,
    };
  }

  private toUpdateInput(dto: UpdateCourseDto): CourseUpdateData {
    const data: CourseUpdateData = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.thumbnail !== undefined) {
      data.thumbnail = dto.thumbnail;
    }

    if (dto.durationInDays !== undefined) {
      data.durationInDays = dto.durationInDays;
    }

    if (dto.price !== undefined) {
      data.price = dto.price;
    }

    if (dto.discount !== undefined) {
      data.discount = dto.discount;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return data;
  }

  private toResponse(course: Course) {
    const response: Partial<
      Course & {
        type?: string | null;
      }
    > = { ...course };

    delete response.type;

    return response;
  }
}
