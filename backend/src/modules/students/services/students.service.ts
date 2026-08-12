import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResourceType } from '@prisma/client';

import { PasswordService } from '../../auth/services/password.service';
import { CurrentUser } from '../../auth/types/current-user.types';
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

  async getMyDashboard(user: CurrentUser) {
    const isStudent = user.roles?.includes('STUDENT');

    if (!isStudent) {
      throw new ForbiddenException('Student dashboard is only available to students');
    }

    const student = await this.studentsRepository.findDashboardStudent(user.userId);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const enrollment = await this.studentsRepository.findActiveEnrollment(
      student.id,
      student.organizationId,
    );
    const organization = enrollment?.organization ?? student.organization ?? null;
    const session = enrollment?.session ?? null;
    const courseEnrollments = enrollment?.courseEnrollments ?? [];
    const sessionCourseIds = courseEnrollments.map(
      (courseEnrollment) => courseEnrollment.sessionCourseId,
    );
    const [notifications, contentUpdates] = await Promise.all([
      organization
        ? this.studentsRepository.findNotifications(student.id, organization.id)
        : Promise.resolve([]),
      this.studentsRepository.findContentUpdates(sessionCourseIds),
    ]);
    const courses = courseEnrollments.map((courseEnrollment) => {
      const sessionCourse = courseEnrollment.sessionCourse;
      const progress = sessionCourse.studentCourseProgress[0];
      const instructor = sessionCourse.instructors[0]?.instructor;

      return {
        id: courseEnrollment.id,
        sessionCourseId: sessionCourse.id,
        courseId: sessionCourse.courseId,
        title: sessionCourse.displayName ?? sessionCourse.course.name,
        shortCode: this.shortCode(sessionCourse.course.code, sessionCourse.course.name),
        instructor: instructor
          ? this.displayName(instructor)
          : 'Instructor not assigned',
        completionPercentage: progress?.completionPercentage ?? 0,
        status: courseEnrollment.status,
        image: sessionCourse.course.thumbnail,
        continuePath: this.buildCoursePath(
          sessionCourse.id,
          progress?.lastAccessedResourceId,
        ),
      };
    });
    const primaryProgress = courseEnrollments
      .map((courseEnrollment) => ({
        sessionCourseId: courseEnrollment.sessionCourseId,
        resourceId:
          courseEnrollment.sessionCourse.studentCourseProgress[0]
            ?.lastAccessedResourceId ?? null,
        updatedAt:
          courseEnrollment.sessionCourse.studentCourseProgress[0]?.updatedAt ??
          courseEnrollment.updatedAt,
      }))
      .sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime())[0];

    return {
      student: {
        id: student.id,
        name: this.displayName(student),
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        avatar: null,
        batch: session?.name ?? null,
        organization,
        session,
      },
      courses,
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        description: notification.description,
        timestamp: notification.createdAt,
        isRead: notification.isRead,
      })),
      contentUpdates: contentUpdates.map((resource) => ({
        id: resource.id,
        resourceId: resource.id,
        resourceType: resource.type,
        title: this.contentUpdateTitle(resource.type),
        description: resource.title,
        timestamp: resource.createdAt,
        path: this.buildResourcePath(resource.folder.sessionCourseId, resource.id),
      })),
      continueLearning: {
        sessionCourseId: primaryProgress?.sessionCourseId ?? null,
        resourceId: primaryProgress?.resourceId ?? null,
        path: primaryProgress
          ? this.buildCoursePath(
              primaryProgress.sessionCourseId,
              primaryProgress.resourceId,
            )
          : '/student/my-courses',
      },
    };
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

  private displayName(user: {
    firstName: string;
    lastName?: string | null;
    email?: string;
  }) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
      || user.email
      || 'Student';
  }

  private shortCode(code: string, name: string) {
    const source = code || name;
    const parts = source
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }

  private contentUpdateTitle(type: ResourceType) {
    if (type === ResourceType.DOCUMENT) return 'New PDF Added';
    if (type === ResourceType.NOTES) return 'New Notes Added';
    if (type === ResourceType.VIDEO) return 'New Video Added';
    if (type === ResourceType.EXAM) return 'New Exam Added';
    if (type === ResourceType.ASSIGNMENT) return 'New Assignment';
    return 'New Content Added';
  }

  private buildCoursePath(sessionCourseId: number, resourceId?: number | null) {
    return resourceId
      ? this.buildResourcePath(sessionCourseId, resourceId)
      : `/student/resources?sessionCourseId=${sessionCourseId}`;
  }

  private buildResourcePath(sessionCourseId: number, resourceId: number) {
    return `/student/resources?sessionCourseId=${sessionCourseId}&resourceId=${resourceId}`;
  }
}
