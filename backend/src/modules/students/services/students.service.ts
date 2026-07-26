import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PasswordService } from '../../auth/services/password.service';
import { RolesService } from '../../roles/services/roles.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import {
  NormalizedStudentQuery,
  StudentUpdateData,
  StudentsRepository,
} from '../repositories/students.repository';

@Injectable()
export class StudentsService {
  constructor(
    @Inject(PasswordService)
    private readonly passwordService: PasswordService,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
    @Inject(StudentsRepository)
    private readonly studentsRepository: StudentsRepository,
  ) {}

  async create(dto: CreateStudentDto) {
    await this.ensureEmailIsUnique(dto.email);

    if (dto.phone) {
      await this.ensurePhoneIsUnique(dto.phone);
    }

    const student = await this.studentsRepository.create({
      ...dto,
      password: await this.passwordService.hash(dto.password),
      isVerified: true,
    });

    await this.rolesService.assignCodeToUser('STUDENT', {
      userId: student.id,
      organizationId: student.organizationId ?? undefined,
    });

    return this.findOne(student.id);
  }

  async findAll(query: StudentQueryDto) {
    const normalized = this.normalizeQuery(query);
    const result = await this.studentsRepository.findMany(
      normalized,
    );

    return {
      items: result.items.map((student) =>
        this.toStudentResponse(student),
      ),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
      },
    };
  }

  async findOne(id: number) {
    const student = await this.findExisting(id);

    return this.toStudentResponse(student);
  }

  async update(id: number, dto: UpdateStudentDto) {
    await this.findExisting(id);

    if (dto.email) {
      await this.ensureEmailIsUnique(dto.email, id);
    }

    if (dto.phone) {
      await this.ensurePhoneIsUnique(dto.phone, id);
    }

    const data = await this.toUpdateInput(dto);
    const student = await this.studentsRepository.update(id, data);

    return this.toStudentResponse(student);
  }

  async remove(id: number) {
    await this.findExisting(id);
    const student = await this.studentsRepository.softDelete(id);

    return this.toStudentResponse(student);
  }

  private async findExisting(id: number) {
    const student = await this.studentsRepository.findById(id);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  private async ensureEmailIsUnique(
    email: string,
    excludeId?: number,
  ) {
    const student = excludeId
      ? await this.studentsRepository.findByEmailExcludingId(
          email,
          excludeId,
        )
      : await this.studentsRepository.findByEmail(email);

    if (student) {
      throw new ConflictException('Email already exists');
    }
  }

  private async ensurePhoneIsUnique(
    phone: string,
    excludeId?: number,
  ) {
    const student = excludeId
      ? await this.studentsRepository.findByPhoneExcludingId(
          phone,
          excludeId,
        )
      : await this.studentsRepository.findByPhone(phone);

    if (student) {
      throw new ConflictException('Phone already exists');
    }
  }

  private normalizeQuery(
    query: StudentQueryDto,
  ): NormalizedStudentQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status,
      organizationId: query.organizationId,
    };
  }

  private async toUpdateInput(
    dto: UpdateStudentDto,
  ): Promise<StudentUpdateData> {
    const data = Object.fromEntries(
      Object.entries(dto).filter(
        ([, value]) => value !== undefined,
      ),
    ) as StudentUpdateData;

    if (dto.password) {
      data.password = await this.passwordService.hash(dto.password);
    }

    return data;
  }

  private toStudentResponse(student: any) {
    const { password, ...response } = student;

    return {
      ...response,
      roles:
        student.userRoles?.map((userRole) => userRole.role) ?? [],
    };
  }
}
