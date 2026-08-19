import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResourceStatus } from '@prisma/client';

import { PasswordService } from '../../auth/services/password.service';
import { CurrentUser } from '../../auth/types/current-user.types';
import { RolesService } from '../../roles/services/roles.service';
import { ResourceService } from '../../resource/services/resource.service';
import {
  RESOURCE_TYPE_CODES,
  RESOURCE_TYPE_IDS,
} from '../../resource/constants/resource-type.constants';
import { CreateStudentDto } from '../dto/create-student.dto';
import { StudentCoursesQueryDto } from '../dto/student-courses-query.dto';
import { UpdateStudentVideoProgressDto } from '../dto/update-student-video-progress.dto';
import {
  StudentResourcesQueryDto,
  StudentResourcesSort,
} from '../dto/student-resources-query.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import {
  NormalizedStudentCoursesQuery,
  NormalizedStudentResourcesQuery,
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
    @Inject(ResourceService)
    private readonly resourceService: ResourceService,
  ) {}

  async create(dto: CreateStudentDto) {
    await this.ensureEmailIsUnique(dto.email);

    if (dto.phone) {
      await this.ensurePhoneIsUnique(dto.phone);
    }

    const student = await this.studentsRepository.create({
      ...dto,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      password: await this.passwordService.hash(dto.password),
      isVerified: true,
    });

    await this.rolesService.assignCodeToUser('STUDENT', {
      userId: student.userId,
      organizationId: student.organizationId ?? undefined,
    });

    return this.findOne(student.id);
  }

  async findAll(query: StudentQueryDto) {
    const normalized = this.normalizeQuery(query);
    const result = await this.studentsRepository.findMany(normalized);

    return {
      items: result.items.map((student) => this.toStudentResponse(student)),
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

  async getMe(user: CurrentUser) {
    const isStudent = user.roles?.includes('STUDENT');

    if (!isStudent) {
      throw new ForbiddenException(
        'Student profile is only available to students',
      );
    }

    const student = await this.studentsRepository.findDashboardStudent(
      user.userId,
    );

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      user: {
        id: student.user.id,
        email: student.user.email,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        roles: user.roles ?? [],
      },
      student: {
        id: student.id,
        uuid: student.uuid,
        organizationId: student.organizationId,
        studentCode: student.studentCode,
        status: student.status,
      },
      profile: student.profile,
    };
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
      throw new ForbiddenException(
        'Student dashboard is only available to students',
      );
    }

    const student = await this.studentsRepository.findDashboardStudent(
      user.userId,
    );

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const enrollment = await this.studentsRepository.findActiveEnrollment(
      student.id,
      student.organizationId,
    );
    const organization =
      enrollment?.organization ?? student.organization ?? null;
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
        shortCode: this.shortCode(
          sessionCourse.course.code,
          sessionCourse.course.name,
        ),
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
      .sort(
        (first, second) =>
          second.updatedAt.getTime() - first.updatedAt.getTime(),
      )[0];

    return {
      student: {
        id: student.id,
        name: this.displayName(student),
        firstName: student.profile?.firstName ?? student.user.firstName,
        lastName: student.profile?.lastName ?? student.user.lastName,
        email: student.user.email,
        avatar: student.profile?.avatar ?? null,
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
        resourceTypeId: resource.resourceTypeId,
        resourceType: resource.resourceType,
        title: this.contentUpdateTitle(resource.resourceType.code),
        description: resource.title,
        timestamp: resource.createdAt,
        path: this.buildResourcePath(
          resource.folder.sessionCourseId,
          resource.id,
        ),
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

  async getMyCourses(user: CurrentUser, query: StudentCoursesQueryDto) {
    const isStudent = user.roles?.includes('STUDENT');

    if (!isStudent) {
      throw new ForbiddenException(
        'Student courses are only available to students',
      );
    }

    const student = await this.studentsRepository.findDashboardStudent(
      user.userId,
    );

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const normalized = this.normalizeStudentCoursesQuery(query);
    const [result, categories] = await Promise.all([
      this.studentsRepository.findStudentCourseEnrollments(
        student.id,
        student.organizationId,
        normalized,
      ),
      this.studentsRepository.findStudentCourseCategories(
        student.id,
        student.organizationId,
      ),
    ]);

    return {
      items: result.items.map((courseEnrollment) =>
        this.toStudentCourseResponse(courseEnrollment),
      ),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
      },
      categories,
    };
  }

  async getMyResources(user: CurrentUser, query: StudentResourcesQueryDto) {
    const isStudent = user.roles?.includes('STUDENT');

    if (!isStudent) {
      throw new ForbiddenException(
        'Student resources are only available to students',
      );
    }

    const student = await this.studentsRepository.findDashboardStudent(
      user.userId,
    );

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const normalized = this.normalizeStudentResourcesQuery(query);
    const [result, optionEnrollments, resourceTypes] = await Promise.all([
      this.studentsRepository.findStudentResources(
        student.id,
        student.organizationId,
        normalized,
      ),
      this.studentsRepository.findStudentResourceOptions(
        student.id,
        student.organizationId,
      ),
      this.resourceService.findResourceTypes(),
    ]);
    const courses = optionEnrollments.map(({ sessionCourse }) => ({
      id: sessionCourse.id,
      name: sessionCourse.displayName ?? sessionCourse.course.name,
    }));
    const subjects = optionEnrollments.flatMap(({ sessionCourse }) =>
      sessionCourse.folders.map((folder) => ({
        id: folder.id,
        sessionCourseId: sessionCourse.id,
        name: folder.name,
      })),
    );

    return {
      items: result.items.map((resource) => ({
        id: resource.id,
        uuid: resource.uuid,
        title: resource.title,
        description: resource.description,
        resourceTypeId: resource.resourceTypeId,
        resourceType: resource.resourceType,
        documentUrl: resource.documentUrl,
        videoUrl: resource.videoUrl,
        thumbnail: resource.thumbnail,
        mimeType: resource.mimeType,
        fileSize: resource.fileSize?.toString() ?? null,
        durationInSeconds: resource.durationInSeconds,
        status: resource.status,
        isDownloadable: resource.isDownloadable,
        createdAt: resource.createdAt,
        course: {
          id: resource.folder.sessionCourse.id,
          courseId: resource.folder.sessionCourse.course.id,
          name:
            resource.folder.sessionCourse.displayName ??
            resource.folder.sessionCourse.course.name,
          code: resource.folder.sessionCourse.course.code,
          sessionId: resource.folder.sessionCourse.session.id,
          sessionName: resource.folder.sessionCourse.session.name,
        },
        subject: {
          id: resource.folder.id,
          name: resource.folder.name,
        },
        uploadedBy: null,
      })),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
      },
      summary: {
        total: result.total,
        videos: result.videos,
        documents: result.documents,
      },
      filters: {
        courses,
        subjects,
        types: resourceTypes,
        statuses: [ResourceStatus.PUBLISHED],
      },
    };
  }

  async getMyResource(user: CurrentUser, resourceId: number) {
    const { resource, student } = await this.findStudentDocument(
      user,
      resourceId,
    );
    const folderResources =
      await this.studentsRepository.findStudentFolderResources(
        resource.folderId,
      );
    const documentResources = folderResources.filter(
      (item) => item.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT,
    );
    const documentIndex = documentResources.findIndex(
      (item) => item.id === resource.id,
    );
    const progress = resource.folder.sessionCourse.studentCourseProgress[0];

    return {
      id: resource.id,
      uuid: resource.uuid,
      title: resource.title,
      description: resource.description,
      resourceTypeId: resource.resourceTypeId,
      resourceType: resource.resourceType,
      fileName: this.documentFileName(resource.title),
      mimeType: resource.mimeType ?? 'application/pdf',
      fileSize: resource.fileSize?.toString() ?? null,
      isDownloadable: resource.isDownloadable,
      createdAt: resource.createdAt,
      course: {
        id: resource.folder.sessionCourse.id,
        courseId: resource.folder.sessionCourse.course.id,
        name:
          resource.folder.sessionCourse.displayName ??
          resource.folder.sessionCourse.course.name,
        code: resource.folder.sessionCourse.course.code,
        sessionId: resource.folder.sessionCourse.session.id,
        sessionName: resource.folder.sessionCourse.session.name,
      },
      subject: { id: resource.folder.id, name: resource.folder.name },
      organization: resource.folder.sessionCourse.session.organization,
      progress: this.toResourceProgress(progress, resource.id),
      estimatedReadingMinutes: null,
      relatedResources: folderResources
        .filter((item) => item.id !== resource.id)
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.title,
          resourceTypeId: item.resourceTypeId,
          resourceType: item.resourceType,
          videoUrl: item.videoUrl,
          thumbnail: item.thumbnail,
        })),
      navigation: {
        current: documentIndex + 1,
        total: documentResources.length,
        previous:
          documentIndex > 0
            ? this.toResourceNavigation(documentResources[documentIndex - 1])
            : null,
        next:
          documentIndex >= 0 && documentIndex < documentResources.length - 1
            ? this.toResourceNavigation(documentResources[documentIndex + 1])
            : null,
      },
    };
  }

  async getMyVideoResource(user: CurrentUser, resourceId: number) {
    const { resource, student } = await this.findStudentVideo(user, resourceId);
    const sessionCourse = resource.folder.sessionCourse;
    const [sequence, progress] = await Promise.all([
      this.studentsRepository.findStudentCourseResourceSequence(
        sessionCourse.id,
      ),
      this.studentsRepository.findStudentVideoProgress(student.id, resource.id),
    ]);
    const resourceIndex = sequence.findIndex((item) => item.id === resource.id);
    const instructor = sessionCourse.instructors[0]?.instructor;

    return {
      id: resource.id,
      uuid: resource.uuid,
      title: resource.title,
      description: resource.description,
      resourceTypeId: resource.resourceTypeId,
      resourceType: resource.resourceType,
      videoUrl: resource.videoUrl,
      thumbnail: resource.thumbnail,
      mimeType: resource.mimeType,
      durationInSeconds: resource.durationInSeconds,
      course: {
        id: sessionCourse.id,
        courseId: sessionCourse.course.id,
        name: sessionCourse.displayName ?? sessionCourse.course.name,
        code: sessionCourse.course.code,
        sessionId: sessionCourse.session.id,
        sessionName: sessionCourse.session.name,
      },
      subject: { id: resource.folder.id, name: resource.folder.name },
      organization: sessionCourse.session.organization,
      instructor: instructor
        ? {
            id: instructor.id,
            name: `${instructor.firstName} ${instructor.lastName ?? ''}`.trim(),
          }
        : null,
      progress: this.toVideoProgress(progress),
      upNext:
        resourceIndex >= 0
          ? sequence.slice(resourceIndex + 1, resourceIndex + 3)
          : [],
    };
  }

  async updateMyVideoProgress(
    user: CurrentUser,
    resourceId: number,
    dto: UpdateStudentVideoProgressDto,
  ) {
    const { resource, student } = await this.findStudentVideo(user, resourceId);
    const duration = resource.durationInSeconds;
    const currentPositionSeconds = Math.floor(
      duration
        ? Math.min(dto.currentPositionSeconds, duration)
        : dto.currentPositionSeconds,
    );
    const existing = await this.studentsRepository.findStudentVideoProgress(
      student.id,
      resource.id,
    );
    const calculatedPercentage = duration
      ? Math.floor((currentPositionSeconds / duration) * 100)
      : 0;
    const endedNearFinish = Boolean(
      dto.ended &&
      (!duration ||
        currentPositionSeconds >= Math.max(duration - 5, duration * 0.95)),
    );
    const completedAt =
      existing?.completedAt ?? (endedNearFinish ? new Date() : null);
    const watchedPercentage = completedAt
      ? 100
      : Math.min(
          99,
          Math.max(existing?.watchedPercentage ?? 0, calculatedPercentage),
        );

    const progress = await this.studentsRepository.upsertStudentVideoProgress(
      student.id,
      resource.id,
      { currentPositionSeconds, watchedPercentage, completedAt },
    );
    await this.studentsRepository.upsertStudentResourceAccess(
      student.id,
      resource.folder.sessionCourse.id,
      resource.id,
    );

    return this.toVideoProgress(progress);
  }

  async recordMyResourceAccess(user: CurrentUser, resourceId: number) {
    const { resource, student } = await this.findStudentDocument(
      user,
      resourceId,
    );
    const progress = await this.studentsRepository.upsertStudentResourceAccess(
      student.id,
      resource.folder.sessionCourse.id,
      resource.id,
    );

    return this.toResourceProgress(progress, resource.id);
  }

  async getMyDocumentFile(user: CurrentUser, resourceId: number) {
    const { resource } = await this.findStudentDocument(user, resourceId);
    const documentUrl = resource.documentUrl;

    if (!documentUrl) {
      throw new NotFoundException('Document file not found');
    }

    const localFileMatch = documentUrl.match(
      /\/folders\/(\d+)\/resources\/file\/([^?#/]+)$/,
    );
    if (localFileMatch && Number(localFileMatch[1]) === resource.folderId) {
      const storedFile = await this.resourceService.readDocumentFile(
        resource.folderId,
        decodeURIComponent(localFileMatch[2]),
      );
      return {
        content: storedFile.stream,
        fileName: storedFile.fileName,
        mimeType: storedFile.mimeType,
      };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(documentUrl);
    } catch {
      throw new BadRequestException('Document URL is invalid');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('Document URL is not supported');
    }

    let response: Response;
    try {
      response = await fetch(parsedUrl, { redirect: 'follow' });
    } catch {
      throw new BadGatewayException('Document storage is unavailable');
    }

    if (!response.ok) {
      throw new BadGatewayException('Document storage returned an error');
    }

    const maximumSize = 25 * 1024 * 1024;
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > maximumSize) {
      throw new BadRequestException('Document exceeds the 25 MB size limit');
    }

    const content = Buffer.from(await response.arrayBuffer());
    if (content.byteLength > maximumSize) {
      throw new BadRequestException('Document exceeds the 25 MB size limit');
    }

    return {
      content,
      fileName: this.documentFileName(resource.title),
      mimeType:
        response.headers.get('content-type') ??
        resource.mimeType ??
        'application/pdf',
    };
  }

  private async findStudentDocument(user: CurrentUser, resourceId: number) {
    const result = await this.findStudentResource(user, resourceId);
    if (result.resource.resourceTypeId !== RESOURCE_TYPE_IDS.DOCUMENT) {
      throw new BadRequestException('Resource is not a document');
    }

    return result;
  }

  private async findStudentVideo(user: CurrentUser, resourceId: number) {
    const result = await this.findStudentResource(user, resourceId);
    if (result.resource.resourceTypeId !== RESOURCE_TYPE_IDS.VIDEO) {
      throw new BadRequestException('Resource is not a video');
    }
    if (!result.resource.videoUrl) {
      throw new NotFoundException('Video source not found');
    }

    return result;
  }

  private async findStudentResource(user: CurrentUser, resourceId: number) {
    if (!user.roles?.includes('STUDENT')) {
      throw new ForbiddenException(
        'Student resources are only available to students',
      );
    }

    const student = await this.studentsRepository.findDashboardStudent(
      user.userId,
    );
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const resource = await this.studentsRepository.findStudentResourceById(
      student.id,
      student.organizationId,
      resourceId,
    );
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    return { resource, student };
  }

  private toVideoProgress(
    progress: {
      currentPositionSeconds: number;
      watchedPercentage: number;
      completedAt: Date | null;
      updatedAt: Date;
    } | null,
  ) {
    const percentage = Math.max(
      0,
      Math.min(100, progress?.watchedPercentage ?? 0),
    );

    return {
      currentPositionSeconds: progress?.currentPositionSeconds ?? 0,
      percentage,
      status: progress?.completedAt
        ? ('COMPLETED' as const)
        : percentage > 0 || (progress?.currentPositionSeconds ?? 0) > 0
          ? ('IN_PROGRESS' as const)
          : ('NOT_STARTED' as const),
      lastWatchedAt: progress?.updatedAt ?? null,
    };
  }

  private toResourceProgress(
    progress:
      | {
          completionPercentage: number;
          lastAccessedResourceId: number | null;
          updatedAt: Date;
        }
      | undefined,
    resourceId: number,
  ) {
    const percentage = Math.max(
      0,
      Math.min(100, progress?.completionPercentage ?? 0),
    );
    const status =
      percentage >= 100
        ? 'COMPLETED'
        : percentage > 0 || progress?.lastAccessedResourceId === resourceId
          ? 'IN_PROGRESS'
          : 'NOT_STARTED';

    return {
      percentage,
      status,
      lastOpenedAt:
        progress?.lastAccessedResourceId === resourceId
          ? progress.updatedAt
          : null,
    };
  }

  private toResourceNavigation(resource: { id: number; title: string }) {
    return { id: resource.id, title: resource.title };
  }

  private documentFileName(title: string) {
    const safeTitle = title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    return /\.pdf$/i.test(safeTitle) ? safeTitle : `${safeTitle}.pdf`;
  }

  private async findExisting(id: number) {
    const student = await this.studentsRepository.findById(id);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  private async ensureEmailIsUnique(email: string, excludeId?: number) {
    const student = excludeId
      ? await this.studentsRepository.findByEmailExcludingId(email, excludeId)
      : await this.studentsRepository.findByEmail(email);

    if (student) {
      throw new ConflictException('Email already exists');
    }
  }

  private async ensurePhoneIsUnique(phone: string, excludeId?: number) {
    const student = excludeId
      ? await this.studentsRepository.findByPhoneExcludingId(phone, excludeId)
      : await this.studentsRepository.findByPhone(phone);

    if (student) {
      throw new ConflictException('Phone already exists');
    }
  }

  private normalizeQuery(query: StudentQueryDto): NormalizedStudentQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status,
      organizationId: query.organizationId,
    };
  }

  private normalizeStudentCoursesQuery(
    query: StudentCoursesQueryDto,
  ): NormalizedStudentCoursesQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search?.trim() ?? '',
      category: query.category?.trim() || undefined,
    };
  }

  private normalizeStudentResourcesQuery(
    query: StudentResourcesQueryDto,
  ): NormalizedStudentResourcesQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search?.trim() ?? '',
      resourceTypeId: query.resourceTypeId,
      sessionCourseId: query.sessionCourseId,
      folderId: query.folderId,
      uploadedOn: query.uploadedOn,
      status: query.status,
      sort: query.sort ?? StudentResourcesSort.NEWEST,
    };
  }

  private async toUpdateInput(
    dto: UpdateStudentDto,
  ): Promise<StudentUpdateData> {
    const data = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as StudentUpdateData;

    if (dto.dateOfBirth) {
      data.dateOfBirth = new Date(dto.dateOfBirth);
    }

    if (dto.password) {
      data.password = await this.passwordService.hash(dto.password);
    }

    return data;
  }

  private toStudentResponse(student: any) {
    const roles =
      student.user?.userRoles?.map((userRole) => userRole.role) ?? [];
    const profile = student.profile ?? null;
    const user = student.user ?? null;

    return {
      id: student.id,
      uuid: student.uuid,
      userId: student.userId,
      organizationId: student.organizationId,
      studentCode: student.studentCode,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      status: student.status,
      isActive: student.isActive,
      isVerified: user?.isVerified ?? false,
      lastLoginAt: user?.lastLoginAt ?? null,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      organization: student.organization,
      profile,
      user: user
        ? {
            id: user.id,
            uuid: user.uuid,
            organizationId: user.organizationId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            status: user.status,
            isActive: user.isActive,
            isVerified: user.isVerified,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
        : null,
      firstName: profile?.firstName ?? user?.firstName ?? '',
      lastName: profile?.lastName ?? user?.lastName ?? null,
      email: user?.email ?? '',
      phone: profile?.phone ?? user?.phone ?? null,
      roles,
    };
  }

  private toStudentCourseResponse(courseEnrollment: any) {
    const sessionCourse = courseEnrollment.sessionCourse;
    const course = sessionCourse.course;
    const progress = sessionCourse.studentCourseProgress[0];
    const completionPercentage = progress?.completionPercentage ?? 0;
    const instructor = sessionCourse.instructors[0]?.instructor;
    const resources = sessionCourse.folders.flatMap(
      (folder) => folder.resources,
    );
    const counts = resources.reduce(
      (totals, resource) => {
        if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) {
          totals.videos += 1;
        }
        if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
          totals.documents += 1;
        }
        if (resource.resourceTypeId === RESOURCE_TYPE_IDS.EXAM) {
          totals.exams += 1;
        }
        return totals;
      },
      { documents: 0, exams: 0, videos: 0 },
    );
    const lastAccessedResource = progress?.lastAccessedResource;

    return {
      id: courseEnrollment.id,
      enrollmentId: courseEnrollment.enrollmentId,
      sessionCourseId: sessionCourse.id,
      courseId: sessionCourse.courseId,
      title: sessionCourse.displayName ?? course.name,
      shortCode: this.shortCode(course.code, course.name),
      program: courseEnrollment.enrollment.session.name,
      description: sessionCourse.description ?? course.description,
      instructor: instructor
        ? this.displayName(instructor)
        : 'Instructor not assigned',
      completionPercentage,
      status: this.toStudentCourseStatus(
        courseEnrollment.status,
        completionPercentage,
      ),
      image: course.thumbnail,
      resourceCounts: counts,
      lastAccessed: lastAccessedResource
        ? {
            resourceId: lastAccessedResource.id,
            title: lastAccessedResource.title,
            resourceTypeId: lastAccessedResource.resourceTypeId,
            resourceType: lastAccessedResource.resourceType,
            timestamp: progress.updatedAt,
            path: this.buildResourcePath(
              sessionCourse.id,
              lastAccessedResource.id,
            ),
          }
        : null,
      continuePath: this.buildCoursePath(
        sessionCourse.id,
        progress?.lastAccessedResourceId,
      ),
      actionLabel:
        completionPercentage > 0 ? 'Continue Learning' : 'Start Course',
    };
  }

  private toStudentCourseStatus(
    enrollmentStatus: string,
    completionPercentage: number,
  ) {
    if (enrollmentStatus === 'COMPLETED' || completionPercentage >= 100) {
      return 'COMPLETED';
    }

    if (completionPercentage > 0) {
      return 'IN_PROGRESS';
    }

    return 'NOT_STARTED';
  }

  private displayName(user: {
    profile?: { firstName: string; lastName?: string | null } | null;
    user?: { firstName: string; lastName?: string | null; email?: string };
    firstName?: string;
    lastName?: string | null;
    email?: string;
  }) {
    return (
      [
        user.profile?.firstName ?? user.user?.firstName ?? user.firstName,
        user.profile?.lastName ?? user.user?.lastName ?? user.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      user.user?.email ||
      user.email ||
      'Student'
    );
  }

  private shortCode(code: string, name: string) {
    const source = code || name;
    const parts = source
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter(Boolean);

    if (parts.length >= 2) {
      return parts
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }

  private contentUpdateTitle(type: string) {
    if (type === RESOURCE_TYPE_CODES.DOCUMENT) return 'New PDF Added';
    if (type === RESOURCE_TYPE_CODES.VIDEO) return 'New Video Added';
    if (type === RESOURCE_TYPE_CODES.EXAM) return 'New Exam Added';
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
