import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ResourceActivityEndReason, ResourceStatus } from '@prisma/client';

import { PasswordService } from '../../auth/services/password.service';
import { CurrentUser } from '../../auth/types/current-user.types';
import { ActivityService } from '../../activity/services/activity.service';
import {
  EndResourceActivityDto,
  ResourceActivityEventDto,
  ResourceActivityHeartbeatDto,
  StartResourceActivityDto,
} from '../../activity/dto/resource-activity.dto';
import { RolesService } from '../../roles/services/roles.service';
import { ResourceService } from '../../resource/services/resource.service';
import {
  RESOURCE_TYPE_CODES,
  RESOURCE_TYPE_IDS,
} from '../../resource/constants/resource-type.constants';
import { CreateStudentDto } from '../dto/create-student.dto';
import { ChangeMyPasswordDto } from '../dto/change-my-password.dto';
import { StudentCoursesQueryDto } from '../dto/student-courses-query.dto';
import {
  StudentCalendarEventType,
  StudentCalendarQueryDto,
} from '../dto/student-calendar-query.dto';
import { StudentFolderResourcesQueryDto } from '../dto/student-folder-resources-query.dto';
import { UpdateStudentVideoProgressDto } from '../dto/update-student-video-progress.dto';
import {
  StudentResourcesQueryDto,
  StudentResourcesSort,
} from '../dto/student-resources-query.dto';
import { StudentQueryDto } from '../dto/student-query.dto';
import { StudentNotificationsQueryDto } from '../dto/student-notifications-query.dto';
import { UpdateStudentNotificationDto } from '../dto/update-student-notification.dto';
import { UpdateMyStudentPreferencesDto } from '../dto/update-my-student-preferences.dto';
import { UpdateMyStudentProfileDto } from '../dto/update-my-student-profile.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import {
  NormalizedStudentCoursesQuery,
  NormalizedStudentFolderResourcesQuery,
  NormalizedStudentResourcesQuery,
  NormalizedStudentQuery,
  StudentUpdateData,
  StudentsRepository,
} from '../repositories/students.repository';
import {
  STUDENT_CALENDAR_MAX_RANGE_DAYS,
  isCalendarExamResourceAssigned,
  normalizeStudentCalendarRange,
  toStudentExamCalendarStatus,
  toStudentSessionCalendarStatus,
} from '../student-calendar.rules';
import {
  isSupportedTimeZone,
  normalizeReminderOffsets,
  studentProfileCompleteness,
} from '../student-profile.rules';
import {
  buildExamReminderNotifications,
  normalizeStudentNotificationsQuery,
  toStudentNotificationAction,
} from '../student-notification.rules';

type StudentFolderResourceResult = NonNullable<
  Awaited<ReturnType<StudentsRepository['findStudentFolderResources']>>
>;
type StudentFolderResourceRecord = StudentFolderResourceResult['items'][number];
type StudentExamGraph = NonNullable<StudentFolderResourceRecord['exam']>;
type StudentCalendarCourse = {
  id: number;
  uuid: string;
  sessionCourseId: number;
  name: string;
  code: string;
};
type StudentCalendarEvent = {
  id: string;
  type: StudentCalendarEventType;
  source: 'EXAM_SCHEDULE' | 'ACADEMIC_SESSION';
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  endInclusive: boolean;
  status: string;
  displayMode: 'STANDARD' | 'BACKGROUND';
  href: string | null;
  resource: { id: number; uuid: string; title: string } | null;
  session: {
    id: number;
    uuid: string;
    name: string;
    code: string | null;
  };
  courses: StudentCalendarCourse[];
  exam: {
    id: number;
    uuid: string;
    code: string;
    durationMinutes: number;
    attemptLimit: number;
    attemptsUsed: number;
    allowResume: boolean;
    activeAttemptUuid: string | null;
    latestAttemptUuid: string | null;
  } | null;
};

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
    @Inject(ActivityService)
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreateStudentDto, actor?: CurrentUser) {
    const organizationId = await this.resolveManagedOrganizationId(
      actor,
      dto.organizationId,
    );
    const enrollment = await this.prepareEnrollment(dto, organizationId);
    await this.ensureEmailIsUnique(dto.email);

    if (dto.phone) {
      await this.ensurePhoneIsUnique(dto.phone);
    }

    const student = await this.studentsRepository.create({
      ...dto,
      organizationId: organizationId ?? undefined,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      password: await this.passwordService.hash(dto.password),
      isVerified: true,
    });

    await this.rolesService.assignCodeToUser('STUDENT', {
      userId: student.userId,
      organizationId: student.organizationId ?? undefined,
    });

    if (enrollment) {
      await this.studentsRepository.upsertEnrollment({
        answers: enrollment.answers,
        organizationId: enrollment.organizationId,
        registrationPageId: enrollment.registrationPageId,
        sessionCourseIds: enrollment.sessionCourseIds,
        sessionId: enrollment.sessionId,
        studentId: student.id,
      });
    }

    return this.findOne(student.id, actor);
  }

  async findAll(query: StudentQueryDto, actor?: CurrentUser) {
    const normalized = this.normalizeQuery(query, actor);
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

  async findOne(id: number, actor?: CurrentUser) {
    const student = await this.findExisting(id);
    this.assertCanAccessStudent(actor, student.organizationId);

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

  async getMyProfile(user: CurrentUser) {
    const student = await this.findSelfProfileOrThrow(user);
    const preferences =
      student.preferences ??
      (await this.studentsRepository.upsertStudentPreferences(student.id));
    const answerByKey = new Map(
      student.registrationAnswers.map((answer) => [
        answer.fieldKey,
        answer.value ?? undefined,
      ]),
    );
    const selections =
      await this.studentsRepository.findRegistrationSelectionNames(
        student.organizationId,
        answerByKey.get('education'),
        answerByKey.get('digital_library_location'),
      );

    return this.toSelfProfileResponse(student, preferences, selections);
  }

  async getMyCalendar(user: CurrentUser, query: StudentCalendarQueryDto) {
    const student = await this.findSelfProfileOrThrow(user);
    const organizationId = this.requireStudentOrganization(student);
    let range: { from: Date; to: Date };

    try {
      range = normalizeStudentCalendarRange(query);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid calendar range',
      );
    }

    const requestedTypes = new Set(
      query.types?.length
        ? query.types
        : [
            StudentCalendarEventType.EXAM,
            StudentCalendarEventType.ACADEMIC_SESSION,
          ],
    );
    const [preferences, examResources, enrollments] = await Promise.all([
      student.preferences
        ? Promise.resolve(student.preferences)
        : this.studentsRepository.upsertStudentPreferences(student.id),
      requestedTypes.has(StudentCalendarEventType.EXAM)
        ? this.studentsRepository.findStudentCalendarExamResources(
            student.id,
            organizationId,
            range,
          )
        : Promise.resolve([]),
      requestedTypes.has(StudentCalendarEventType.ACADEMIC_SESSION)
        ? this.studentsRepository.findStudentCalendarEnrollments(
            student.id,
            organizationId,
            range,
          )
        : Promise.resolve([]),
    ]);
    const eventById = new Map<string, StudentCalendarEvent>();

    for (const resource of examResources) {
      const exam = resource.exam;
      const sessionCourse = resource.folder.sessionCourse;

      if (
        !exam ||
        exam.organizationId !== organizationId ||
        sessionCourse.session.organizationId !== organizationId ||
        !isCalendarExamResourceAssigned({
          folderSessionCourseId: sessionCourse.id,
          assignmentSessionCourseIds: exam.courseAssignments.map(
            (assignment) => assignment.sessionCourseId,
          ),
        })
      ) {
        continue;
      }

      const course = this.toStudentCalendarCourse(sessionCourse);
      const eventId = `exam:${exam.uuid}`;
      const existing = eventById.get(eventId);

      if (existing) {
        if (
          !existing.courses.some(
            (item) => item.sessionCourseId === course.sessionCourseId,
          )
        ) {
          existing.courses.push(course);
        }
        continue;
      }

      const latestAttempt = exam.attempts[0] ?? null;
      const activeAttempt =
        exam.attempts.find((attempt) => attempt.status === 'IN_PROGRESS') ??
        null;
      eventById.set(eventId, {
        id: eventId,
        type: StudentCalendarEventType.EXAM,
        source: 'EXAM_SCHEDULE',
        title: exam.title,
        description: resource.description,
        startsAt: exam.availableFrom,
        endsAt: exam.availableUntil,
        allDay: false,
        endInclusive: false,
        status: toStudentExamCalendarStatus(exam),
        displayMode: 'STANDARD',
        href:
          exam.status === 'CANCELLED'
            ? null
            : `/student/resources/${resource.id}/exam`,
        resource: {
          id: resource.id,
          uuid: resource.uuid,
          title: resource.title,
        },
        session: {
          id: sessionCourse.session.id,
          uuid: sessionCourse.session.uuid,
          name: sessionCourse.session.name,
          code: sessionCourse.session.code,
        },
        courses: [course],
        exam: {
          id: exam.id,
          uuid: exam.uuid,
          code: exam.code,
          durationMinutes: exam.durationMinutes,
          attemptLimit: exam.attemptLimit,
          attemptsUsed: exam.attempts.length,
          allowResume: exam.allowResume,
          activeAttemptUuid: activeAttempt?.uuid ?? null,
          latestAttemptUuid: latestAttempt?.uuid ?? null,
        },
      });
    }

    for (const enrollment of enrollments) {
      const session = enrollment.session;
      const courses = enrollment.courseEnrollments.map(({ sessionCourse }) =>
        this.toStudentCalendarCourse(sessionCourse),
      );

      eventById.set(`academic-session:${session.uuid}`, {
        id: `academic-session:${session.uuid}`,
        type: StudentCalendarEventType.ACADEMIC_SESSION,
        source: 'ACADEMIC_SESSION',
        title: session.name,
        description: session.description,
        startsAt: session.startDate,
        endsAt: session.endDate,
        allDay: true,
        endInclusive: true,
        status: toStudentSessionCalendarStatus(session),
        displayMode: 'BACKGROUND',
        href: null,
        resource: null,
        session: {
          id: session.id,
          uuid: session.uuid,
          name: session.name,
          code: session.code,
        },
        courses,
        exam: null,
      });
    }

    const search = query.search?.trim().toLocaleLowerCase() ?? '';
    const events = [...eventById.values()]
      .filter(
        (event) =>
          !query.courseId ||
          event.courses.some((course) => course.id === query.courseId),
      )
      .filter((event) => {
        if (!search) return true;
        return [
          event.title,
          event.description,
          event.session.name,
          event.session.code,
          event.exam?.code,
          ...event.courses.flatMap((course) => [course.name, course.code]),
        ].some((value) => value?.toLocaleLowerCase().includes(search));
      })
      .sort(
        (first, second) =>
          first.startsAt.getTime() - second.startsAt.getTime() ||
          first.type.localeCompare(second.type) ||
          first.title.localeCompare(second.title),
      );
    const availableCourses = [
      ...new Map(
        [...eventById.values()]
          .flatMap((event) => event.courses)
          .map((course) => [course.id, course]),
      ).values(),
    ].sort((first, second) => first.name.localeCompare(second.name));
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      timezone: preferences.timezone,
      generatedAt: now,
      range: {
        from: range.from,
        to: range.to,
        maxDays: STUDENT_CALENDAR_MAX_RANGE_DAYS,
      },
      appliedFilters: {
        types: [...requestedTypes],
        courseId: query.courseId ?? null,
        search: query.search?.trim() ?? '',
      },
      availableCourses,
      summary: {
        total: events.length,
        exams: events.filter(
          (event) => event.type === StudentCalendarEventType.EXAM,
        ).length,
        academicSessions: events.filter(
          (event) => event.type === StudentCalendarEventType.ACADEMIC_SESSION,
        ).length,
        upcoming: events.filter((event) => event.status === 'UPCOMING').length,
        availableExams: events.filter(
          (event) =>
            event.type === StudentCalendarEventType.EXAM &&
            event.status === 'AVAILABLE',
        ).length,
        closingWithinSevenDays: events.filter(
          (event) =>
            event.type === StudentCalendarEventType.EXAM &&
            event.status !== 'CANCELLED' &&
            event.endsAt > now &&
            event.endsAt <= sevenDaysFromNow,
        ).length,
      },
      events,
    };
  }

  async getMyNotifications(
    user: CurrentUser,
    query: StudentNotificationsQueryDto,
  ) {
    const student = await this.findSelfProfileOrThrow(user);
    const organizationId = this.requireStudentOrganization(student);
    const preferences =
      student.preferences ??
      (await this.studentsRepository.upsertStudentPreferences(student.id));

    await this.synchronizeExamNotifications(
      student.id,
      organizationId,
      preferences,
    );

    const normalized = normalizeStudentNotificationsQuery(query);
    const result = await this.studentsRepository.findStudentNotifications(
      student.id,
      organizationId,
      normalized,
    );
    return {
      items: result.items.map((notification) => ({
        uuid: notification.uuid,
        type: notification.type,
        title: notification.title,
        description: notification.description,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
        action: toStudentNotificationAction(notification),
      })),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
        unread: result.unread,
      },
      summary: {
        unread: result.unread,
        byType: {
          EXAM: result.countsByType.EXAM,
          RESOURCE: result.countsByType.RESOURCE,
          ANNOUNCEMENT: result.countsByType.ANNOUNCEMENT,
          SYSTEM: result.countsByType.SYSTEM,
        },
      },
      delivery: {
        inAppEnabled: preferences.inAppNotifications,
        examRemindersEnabled: preferences.examReminders,
        resourceUpdatesEnabled: preferences.resourceUpdates,
        announcementNotificationsEnabled: preferences.announcementNotifications,
        securityAlertsEnabled: preferences.securityAlerts,
      },
    };
  }

  async getMyUnreadNotificationCount(user: CurrentUser) {
    const student = await this.findSelfProfileOrThrow(user);
    const organizationId = this.requireStudentOrganization(student);
    const preferences =
      student.preferences ??
      (await this.studentsRepository.upsertStudentPreferences(student.id));
    await this.synchronizeExamNotifications(
      student.id,
      organizationId,
      preferences,
    );

    return {
      unread: await this.studentsRepository.countUnreadStudentNotifications(
        student.id,
        organizationId,
      ),
    };
  }

  async updateMyNotification(
    user: CurrentUser,
    notificationUuid: string,
    dto: UpdateStudentNotificationDto,
  ) {
    const student = await this.findSelfProfileOrThrow(user);
    const organizationId = this.requireStudentOrganization(student);
    const notification =
      await this.studentsRepository.updateStudentNotificationReadState(
        student.id,
        organizationId,
        notificationUuid,
        dto.isRead,
      );

    if (!notification) throw new NotFoundException('Notification not found');

    return {
      uuid: notification.uuid,
      isRead: notification.isRead,
      updatedAt: notification.updatedAt,
    };
  }

  async markAllMyNotificationsRead(user: CurrentUser) {
    const student = await this.findSelfProfileOrThrow(user);
    const organizationId = this.requireStudentOrganization(student);
    const result =
      await this.studentsRepository.markAllStudentNotificationsRead(
        student.id,
        organizationId,
      );

    return { updated: result.count, unread: 0 };
  }

  async updateMyProfile(user: CurrentUser, dto: UpdateMyStudentProfileDto) {
    const student = await this.findSelfProfileOrThrow(user);
    const nullableFields = [
      'lastName',
      'gender',
      'alternatePhone',
      'address',
      'city',
      'state',
      'postalCode',
      'avatar',
      'guardianName',
      'guardianPhone',
      'emergencyContactName',
      'emergencyContactPhone',
    ] as const;
    const data = {
      ...dto,
      dateOfBirth:
        dto.dateOfBirth === undefined
          ? undefined
          : dto.dateOfBirth
            ? new Date(dto.dateOfBirth)
            : null,
    };

    for (const field of nullableFields) {
      if (data[field] === '') data[field] = null;
    }

    await this.studentsRepository.updateSelfProfile(
      student.id,
      student.userId,
      student.user.firstName,
      data,
    );

    return this.getMyProfile(user);
  }

  async updateMyPreferences(
    user: CurrentUser,
    dto: UpdateMyStudentPreferencesDto,
  ) {
    const student = await this.findSelfProfileOrThrow(user);

    if (dto.timezone && !isSupportedTimeZone(dto.timezone)) {
      throw new BadRequestException('Unsupported IANA timezone');
    }

    return this.studentsRepository.upsertStudentPreferences(student.id, {
      ...dto,
      examReminderOffsetsMinutes: dto.examReminderOffsetsMinutes
        ? normalizeReminderOffsets(dto.examReminderOffsetsMinutes)
        : undefined,
    });
  }

  async changeMyPassword(user: CurrentUser, dto: ChangeMyPasswordDto) {
    await this.findSelfProfileOrThrow(user);
    const account = await this.studentsRepository.findUserPassword(user.userId);

    if (
      !account ||
      !(await this.passwordService.compare(
        dto.currentPassword,
        account.password,
      ))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await this.passwordService.compare(dto.newPassword, account.password)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const result =
      await this.studentsRepository.updatePasswordAndRevokeSessions(
        user.userId,
        await this.passwordService.hash(dto.newPassword),
      );

    return {
      changed: true,
      reauthenticationRequired: true,
      revokedSessions: result.revokedSessions,
      message: 'Password changed. Sign in again on your devices.',
    };
  }

  async update(id: number, dto: UpdateStudentDto, actor?: CurrentUser) {
    const existing = await this.findExisting(id);
    this.assertCanAccessStudent(actor, existing.organizationId);
    const organizationId = await this.resolveManagedOrganizationId(
      actor,
      dto.organizationId ?? existing.organizationId ?? undefined,
    );

    if (dto.email) {
      await this.ensureEmailIsUnique(dto.email, id);
    }

    if (dto.phone) {
      await this.ensurePhoneIsUnique(dto.phone, id);
    }

    const data = await this.toUpdateInput(dto);
    data.organizationId = organizationId ?? undefined;
    const student = await this.studentsRepository.update(id, data);

    return this.toStudentResponse(student);
  }

  async remove(id: number, actor?: CurrentUser) {
    const existing = await this.findExisting(id);
    this.assertCanAccessStudent(actor, existing.organizationId);
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
        continuePath: this.buildCoursePath(sessionCourse.id),
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
          ? this.buildCoursePath(primaryProgress.sessionCourseId)
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

  async getMyCourseFolders(user: CurrentUser, sessionCourseId: number) {
    const student = await this.findCurrentStudent(user);
    const organizationId = this.requireStudentOrganization(student);
    const enrollment = await this.studentsRepository.findStudentCourseFolders(
      student.id,
      organizationId,
      sessionCourseId,
    );

    if (!enrollment) {
      throw new NotFoundException('Assigned course not found');
    }

    const sessionCourse = enrollment.sessionCourse;

    return {
      course: {
        id: sessionCourse.id,
        courseId: sessionCourse.course.id,
        name: sessionCourse.displayName ?? sessionCourse.course.name,
        code: sessionCourse.course.code,
        description:
          sessionCourse.description ?? sessionCourse.course.description,
        sessionId: sessionCourse.session.id,
        sessionName: sessionCourse.session.name,
      },
      folders: sessionCourse.folders.map((folder) => {
        const resourceCounts = folder.resources.reduce(
          (counts, resource) => {
            counts.total += 1;
            if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) {
              counts.videos += 1;
            } else if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
              counts.documents += 1;
            } else if (resource.resourceTypeId === RESOURCE_TYPE_IDS.EXAM) {
              counts.exams += 1;
            }
            return counts;
          },
          { total: 0, videos: 0, documents: 0, exams: 0 },
        );

        return {
          id: folder.id,
          name: folder.name,
          description: folder.description,
          icon: folder.icon,
          color: folder.color,
          resourceCounts,
        };
      }),
    };
  }

  async getMyFolderResources(
    user: CurrentUser,
    sessionCourseId: number,
    folderId: number,
    query: StudentFolderResourcesQueryDto,
  ) {
    const student = await this.findCurrentStudent(user);
    const organizationId = this.requireStudentOrganization(student);
    const normalized = this.normalizeStudentFolderResourcesQuery(query);
    const [result, resourceTypes] = await Promise.all([
      this.studentsRepository.findStudentFolderResources(
        student.id,
        organizationId,
        sessionCourseId,
        folderId,
        normalized,
      ),
      this.resourceService.findResourceTypes(),
    ]);

    if (!result) {
      throw new NotFoundException('Course folder not found');
    }

    const sessionCourse = result.access.sessionCourse;
    const folder = sessionCourse.folders[0];

    return {
      course: {
        id: sessionCourse.id,
        courseId: sessionCourse.course.id,
        name: sessionCourse.displayName ?? sessionCourse.course.name,
        code: sessionCourse.course.code,
        description:
          sessionCourse.description ?? sessionCourse.course.description,
        sessionId: sessionCourse.session.id,
        sessionName: sessionCourse.session.name,
      },
      folder: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        icon: folder.icon,
        color: folder.color,
      },
      items: result.items.map((resource) =>
        this.toStudentFolderResource(resource),
      ),
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
        exams: result.exams,
      },
      filters: {
        types: resourceTypes.filter((type) =>
          new Set<number>([
            RESOURCE_TYPE_IDS.DOCUMENT,
            RESOURCE_TYPE_IDS.VIDEO,
            RESOURCE_TYPE_IDS.EXAM,
          ]).has(type.id),
        ),
      },
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
        exams: result.exams,
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
      await this.studentsRepository.findFolderResourceSequence(
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

  async getMyExamResource(user: CurrentUser, resourceId: number) {
    const { resource } = await this.findStudentResource(user, resourceId);

    if (resource.resourceTypeId !== RESOURCE_TYPE_IDS.EXAM) {
      throw new BadRequestException('Resource is not an exam');
    }
    if (!resource.exam) {
      throw new NotFoundException('Exam is not available');
    }

    const sessionCourse = resource.folder.sessionCourse;
    this.ensureExamMatchesSessionCourse(resource.exam, sessionCourse.id);
    const stats = this.examStats(resource.exam);
    const availability = this.toExamAvailability(resource.exam);
    const now = new Date();
    const activeAttempt = resource.exam.attempts.find(
      (attempt) => attempt.status === 'IN_PROGRESS',
    );
    const timeoutNeedsAction = Boolean(
      activeAttempt &&
      activeAttempt.expiresAt <= now &&
      !resource.exam.autoSubmitOnTimeout,
    );
    const attemptsUsed = resource.exam.attempts.length;
    const attemptsRemaining = Math.max(
      0,
      resource.exam.attemptLimit - attemptsUsed,
    );
    const action = activeAttempt
      ? resource.exam.allowResume || timeoutNeedsAction
        ? 'RESUME'
        : 'UNAVAILABLE'
      : availability === 'AVAILABLE' &&
          attemptsUsed < resource.exam.attemptLimit
        ? 'START'
        : attemptsUsed > 0
          ? 'VIEW_RESULT'
          : 'UNAVAILABLE';
    const actionReason = activeAttempt
      ? action === 'RESUME'
        ? 'ACTIVE_ATTEMPT'
        : 'RESUME_DISABLED'
      : action === 'START'
        ? 'READY'
        : action === 'VIEW_RESULT'
          ? attemptsRemaining === 0
            ? 'ATTEMPT_LIMIT_EXHAUSTED'
            : availability === 'CLOSED'
              ? 'EXAM_ENDED'
              : 'RESULT_AVAILABLE'
          : availability === 'UPCOMING'
            ? 'EXAM_UPCOMING'
            : availability === 'CLOSED'
              ? 'EXAM_ENDED'
              : 'EXAM_UNAVAILABLE';
    const actionMessage = this.toExamActionMessage({
      actionReason,
      activeAttemptExpired: Boolean(
        activeAttempt && activeAttempt.expiresAt <= now,
      ),
      attemptLimit: resource.exam.attemptLimit,
      availableFrom: resource.exam.availableFrom,
      availableUntil: resource.exam.availableUntil,
    });

    return {
      id: resource.id,
      uuid: resource.uuid,
      title: resource.title,
      description: resource.description,
      resourceTypeId: resource.resourceTypeId,
      resourceType: resource.resourceType,
      course: {
        id: sessionCourse.id,
        courseId: sessionCourse.course.id,
        name: sessionCourse.displayName ?? sessionCourse.course.name,
        code: sessionCourse.course.code,
        sessionId: sessionCourse.session.id,
        sessionName: sessionCourse.session.name,
      },
      folder: {
        id: resource.folder.id,
        name: resource.folder.name,
      },
      organization: sessionCourse.session.organization,
      exam: {
        id: resource.exam.id,
        code: resource.exam.code,
        title: resource.exam.title,
        instructions: resource.exam.instructions,
        status: resource.exam.status,
        availability,
        availableFrom: resource.exam.availableFrom,
        availableUntil: resource.exam.availableUntil,
        durationMinutes: resource.exam.durationMinutes,
        attemptLimit: resource.exam.attemptLimit,
        attemptsUsed,
        attemptsRemaining,
        action,
        actionReason,
        actionMessage,
        activeAttemptUuid: activeAttempt?.uuid ?? null,
        latestAttemptUuid: resource.exam.attempts[0]?.uuid ?? null,
        allowResume: resource.exam.allowResume,
        resultReleaseMode: resource.exam.resultReleaseMode,
        questionCount: stats.questionCount,
        maximumMarks: stats.maximumMarks,
        sections: stats.sections,
      },
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

  async startMyResourceActivity(
    user: CurrentUser,
    resourceId: number,
    dto: StartResourceActivityDto,
  ) {
    const { resource, student } = await this.findStudentResource(
      user,
      resourceId,
    );
    const session = await this.activityService.startResourceSession({
      studentId: student.id,
      resourceId: resource.id,
      userActivitySessionUuid: user.activitySessionUuid,
      clientSessionUuid: dto.clientSessionUuid,
      startPositionSeconds: dto.startPositionSeconds,
    });
    if (!session) throw new ConflictException('Unable to start activity');
    const policy = await this.activityService.getPolicy(user);

    return {
      sessionUuid: session.uuid,
      startedAt: session.startedAt,
      heartbeatSeconds: policy.resourceHeartbeatSeconds,
      idleThresholdSeconds: policy.idleThresholdSeconds,
    };
  }

  async heartbeatMyResourceActivity(
    user: CurrentUser,
    sessionUuid: string,
    dto: ResourceActivityHeartbeatDto,
  ) {
    const session = await this.activityService.heartbeatResourceSession(
      sessionUuid,
      user.userId,
      dto,
    );
    if (!session) throw new ConflictException('Resource activity was closed');

    return {
      sessionUuid: session.uuid,
      lastHeartbeatAt: session.lastHeartbeatAt,
      activeDurationSeconds: session.activeDurationSeconds,
      idleDurationSeconds: session.idleDurationSeconds,
      completed: session.completed,
    };
  }

  switchMyDocumentPage(
    user: CurrentUser,
    sessionUuid: string,
    pageNumber: number,
  ) {
    return this.activityService.switchDocumentPage(
      sessionUuid,
      user.userId,
      pageNumber,
    );
  }

  recordMyResourceActivityEvent(
    user: CurrentUser,
    sessionUuid: string,
    dto: ResourceActivityEventDto,
  ) {
    return this.activityService.recordResourceSessionEvent(
      sessionUuid,
      user.userId,
      dto,
    );
  }

  endMyResourceActivity(
    user: CurrentUser,
    sessionUuid: string,
    dto: EndResourceActivityDto,
  ) {
    const clientEndReasons = new Set<ResourceActivityEndReason>([
      ResourceActivityEndReason.CLOSED,
      ResourceActivityEndReason.NAVIGATED_AWAY,
      ResourceActivityEndReason.COMPLETED,
    ]);
    if (!clientEndReasons.has(dto.reason)) {
      throw new BadRequestException('Unsupported resource end reason');
    }

    return this.activityService.endResourceSession(
      sessionUuid,
      user.userId,
      dto,
    );
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

    if (resource.resourceTypeId === RESOURCE_TYPE_IDS.EXAM) {
      if (!resource.exam) {
        throw new NotFoundException('Exam is not available');
      }
      this.ensureExamMatchesSessionCourse(
        resource.exam,
        resource.folder.sessionCourse.id,
      );
    }

    return { resource, student };
  }

  private async findCurrentStudent(user: CurrentUser) {
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

    return student;
  }

  private requireStudentOrganization(student: {
    organizationId: number | null;
  }) {
    if (!student.organizationId) {
      throw new ForbiddenException('Student organization is required');
    }

    return student.organizationId;
  }

  private async synchronizeExamNotifications(
    studentId: number,
    organizationId: number,
    preferences: {
      inAppNotifications: boolean;
      examReminders: boolean;
      examReminderOffsetsMinutes: unknown;
    },
  ) {
    if (!preferences.inAppNotifications || !preferences.examReminders) return;

    const now = new Date();
    const reminderOffsets = this.toReminderOffsets(
      preferences.examReminderOffsetsMinutes,
    );
    const maxOffset = Math.max(60, ...reminderOffsets);
    const examResources =
      await this.studentsRepository.findStudentCalendarExamResources(
        studentId,
        organizationId,
        {
          from: now,
          to: new Date(now.getTime() + maxOffset * 60_000),
        },
      );
    const notifications = examResources.flatMap((resource) => {
      const exam = resource.exam;
      const sessionCourseId = resource.folder.sessionCourse.id;
      if (
        !exam ||
        exam.organizationId !== organizationId ||
        !isCalendarExamResourceAssigned({
          folderSessionCourseId: sessionCourseId,
          assignmentSessionCourseIds: exam.courseAssignments.map(
            (assignment) => assignment.sessionCourseId,
          ),
        })
      ) {
        return [];
      }

      return buildExamReminderNotifications(
        {
          resourceId: resource.id,
          title: exam.title,
          availableFrom: exam.availableFrom,
          availableUntil: exam.availableUntil,
          status: exam.status,
          attemptLimit: exam.attemptLimit,
          attemptsUsed: exam.attempts.length,
        },
        reminderOffsets,
        now,
      );
    });

    await this.studentsRepository.createStudentNotificationsIfMissing(
      studentId,
      organizationId,
      notifications,
    );
  }

  private toReminderOffsets(value: unknown) {
    if (!Array.isArray(value)) return [1440, 60];
    const offsets = value.filter(
      (item): item is number =>
        typeof item === 'number' &&
        Number.isInteger(item) &&
        item >= 5 &&
        item <= 43_200,
    );
    return normalizeReminderOffsets(offsets.length ? offsets : [1440, 60]);
  }

  private normalizeStudentFolderResourcesQuery(
    query: StudentFolderResourcesQueryDto,
  ): NormalizedStudentFolderResourcesQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      search: query.search?.trim() ?? '',
      resourceTypeId: query.resourceTypeId,
      uploadedOn: query.uploadedOn,
      sort: query.sort ?? StudentResourcesSort.NEWEST,
    };
  }

  private toStudentFolderResource(resource: StudentFolderResourceRecord) {
    const exam = resource.exam ?? null;
    const stats = exam ? this.examStats(exam) : null;
    const latestAttempt = exam?.attempts?.[0];
    const examProgress = latestAttempt
      ? ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'].includes(
          latestAttempt.status,
        )
        ? 'COMPLETED'
        : latestAttempt.status === 'IN_PROGRESS'
          ? 'IN_PROGRESS'
          : 'NOT_STARTED'
      : 'NOT_STARTED';
    const videoProgress = resource.videoProgress?.[0]
      ? this.toVideoProgress(resource.videoProgress[0])
      : null;

    return {
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
      progressStatus:
        resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO
          ? (videoProgress?.status ?? 'NOT_STARTED')
          : resource.resourceTypeId === RESOURCE_TYPE_IDS.EXAM
            ? examProgress
            : null,
      progressPercentage:
        resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO
          ? (videoProgress?.percentage ?? 0)
          : null,
      exam: exam
        ? {
            id: exam.id,
            code: exam.code,
            status: exam.status,
            availability: this.toExamAvailability(exam),
            availableFrom: exam.availableFrom,
            availableUntil: exam.availableUntil,
            durationMinutes: exam.durationMinutes,
            attemptLimit: exam.attemptLimit,
            attemptsUsed: exam.attempts.length,
            questionCount: stats?.questionCount ?? 0,
            maximumMarks: stats?.maximumMarks ?? 0,
          }
        : null,
    };
  }

  private ensureExamMatchesSessionCourse(
    exam: { courseAssignments?: { sessionCourseId: number }[] },
    sessionCourseId: number,
  ) {
    if (
      !exam.courseAssignments?.some(
        (assignment) => assignment.sessionCourseId === sessionCourseId,
      )
    ) {
      throw new NotFoundException('Exam is not assigned to this course');
    }
  }

  private examStats(exam: StudentExamGraph) {
    const sections = (exam.selectedSlots ?? []).flatMap((selectedSlot) =>
      (selectedSlot.templateSlot?.sections ?? []).map((section) => {
        const questions = (section.subjects ?? []).flatMap(
          (subject) => subject.questions ?? [],
        );

        return {
          id: section.id,
          code: section.code,
          name: section.name,
          durationMinutes: section.durationMinutes,
          subjects: (section.subjects ?? [])
            .map((subject) => subject.subject?.name)
            .filter(Boolean),
          questionCount: questions.length,
          maximumMarks: questions.reduce(
            (total, question) => total + Number(question.marks ?? 0),
            0,
          ),
        };
      }),
    );

    return {
      sections,
      questionCount: sections.reduce(
        (total, section) => total + section.questionCount,
        0,
      ),
      maximumMarks: sections.reduce(
        (total, section) => total + section.maximumMarks,
        0,
      ),
    };
  }

  private toExamAvailability(exam: {
    status: string;
    availableFrom: Date;
    availableUntil: Date;
  }) {
    const now = Date.now();
    if (['CANCELLED', 'ARCHIVED', 'DRAFT'].includes(exam.status)) {
      return 'UNAVAILABLE';
    }
    if (exam.availableFrom.getTime() > now) {
      return 'UPCOMING';
    }
    if (exam.status === 'CLOSED' || exam.availableUntil.getTime() < now) {
      return 'CLOSED';
    }
    return 'AVAILABLE';
  }

  private toExamActionMessage(input: {
    actionReason: string;
    activeAttemptExpired: boolean;
    attemptLimit: number;
    availableFrom: Date;
    availableUntil: Date;
  }) {
    switch (input.actionReason) {
      case 'READY':
        return `You can start this exam now. ${input.attemptLimit} attempt${input.attemptLimit === 1 ? '' : 's'} are allowed.`;
      case 'ACTIVE_ATTEMPT':
        return input.activeAttemptExpired
          ? 'The timer has ended. Reopen the attempt to review the timeout message and complete submission.'
          : 'An unfinished attempt is saved. Resume to continue from your last saved question.';
      case 'ATTEMPT_LIMIT_EXHAUSTED':
        return `You have used all ${input.attemptLimit} allowed attempt${input.attemptLimit === 1 ? '' : 's'}. You can view your latest released result, but cannot start another attempt.`;
      case 'RESULT_AVAILABLE':
        return 'A completed attempt is available. Open the report to review your performance.';
      case 'EXAM_UPCOMING':
        return `This exam opens on ${this.formatExamDateTime(input.availableFrom)}. Return after the opening time to start.`;
      case 'EXAM_ENDED':
        return `This exam closed on ${this.formatExamDateTime(input.availableUntil)}. New attempts are no longer accepted.`;
      case 'RESUME_DISABLED':
        return 'An attempt is already in progress, but this exam does not allow resuming after leaving. Contact your teacher or administrator for help.';
      default:
        return 'This exam is not currently open for student attempts. Contact your teacher or administrator if you believe this is incorrect.';
    }
  }

  private formatExamDateTime(value: Date) {
    return value.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
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

  private toStudentCalendarCourse(sessionCourse: {
    id: number;
    uuid: string;
    displayName: string | null;
    course: { id: number; uuid: string; code: string; name: string };
  }): StudentCalendarCourse {
    return {
      id: sessionCourse.course.id,
      uuid: sessionCourse.course.uuid,
      sessionCourseId: sessionCourse.id,
      name: sessionCourse.displayName ?? sessionCourse.course.name,
      code: sessionCourse.course.code,
    };
  }

  private async findSelfProfileOrThrow(user: CurrentUser) {
    if (!user.roles?.includes('STUDENT')) {
      throw new ForbiddenException(
        'Student profile is only available to students',
      );
    }

    const student = await this.studentsRepository.findSelfProfile(user.userId);
    if (!student) throw new NotFoundException('Student not found');

    return student;
  }

  private toSelfProfileResponse(
    student: NonNullable<
      Awaited<ReturnType<StudentsRepository['findSelfProfile']>>
    >,
    preferences: Awaited<
      ReturnType<StudentsRepository['upsertStudentPreferences']>
    >,
    selections: Awaited<
      ReturnType<StudentsRepository['findRegistrationSelectionNames']>
    >,
  ) {
    const profile = {
      firstName: student.profile?.firstName ?? student.user.firstName,
      lastName: student.profile?.lastName ?? student.user.lastName,
      dateOfBirth: student.profile?.dateOfBirth ?? null,
      gender: student.profile?.gender ?? null,
      alternatePhone: student.profile?.alternatePhone ?? null,
      address: student.profile?.address ?? null,
      city: student.profile?.city ?? null,
      state: student.profile?.state ?? null,
      postalCode: student.profile?.postalCode ?? null,
      avatar: student.profile?.avatar ?? null,
      guardianName: student.profile?.guardianName ?? null,
      guardianPhone: student.profile?.guardianPhone ?? null,
      emergencyContactName: student.profile?.emergencyContactName ?? null,
      emergencyContactPhone: student.profile?.emergencyContactPhone ?? null,
      updatedAt: student.profile?.updatedAt ?? null,
    };
    const completeness = studentProfileCompleteness({
      ...profile,
      phone: student.user.phone,
    });
    const customRegistrationAnswers = student.registrationAnswers
      .filter(
        (answer) =>
          !['education', 'digital_library_location'].includes(answer.fieldKey),
      )
      .map((answer) => ({
        fieldKey: answer.fieldKey,
        label: answer.field?.label ?? this.humanizeFieldKey(answer.fieldKey),
        fieldType: answer.field?.fieldType ?? null,
        mapsTo: answer.field?.mapsTo ?? null,
        value: answer.value,
        updatedAt: answer.updatedAt,
      }));

    return {
      account: {
        id: student.user.id,
        email: student.user.email,
        phone: student.user.phone,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        isVerified: student.user.isVerified,
        lastLoginAt: student.user.lastLoginAt,
        verification: {
          account: student.user.isVerified ? 'VERIFIED' : 'UNVERIFIED',
          emailChangeAvailable: false,
          phoneChangeAvailable: false,
          note: 'Primary email and phone are managed by the institute until a verification provider is configured.',
        },
      },
      student: {
        id: student.id,
        uuid: student.uuid,
        organizationId: student.organizationId,
        studentCode: student.studentCode,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        status: student.status,
        organization: student.organization,
      },
      profile,
      academic: {
        education: selections.education,
        digitalLibraryLocation: selections.digitalLibraryLocation,
        enrollments: student.enrollments.map((enrollment) => ({
          id: enrollment.id,
          status: enrollment.status,
          session: enrollment.session,
          courses: enrollment.courseEnrollments.map((courseEnrollment) => ({
            enrollmentId: courseEnrollment.id,
            sessionCourseId: courseEnrollment.sessionCourse.id,
            uuid: courseEnrollment.sessionCourse.uuid,
            name:
              courseEnrollment.sessionCourse.displayName ??
              courseEnrollment.sessionCourse.course.name,
            course: courseEnrollment.sessionCourse.course,
          })),
        })),
      },
      preferences: {
        ...preferences,
        examReminderOffsetsMinutes: this.toNumberArray(
          preferences.examReminderOffsetsMinutes,
        ),
      },
      customRegistrationAnswers,
      profileCompleteness: completeness,
      fieldAccess: {
        studentEditable: [
          'firstName',
          'lastName',
          'dateOfBirth',
          'gender',
          'alternatePhone',
          'address',
          'city',
          'state',
          'postalCode',
          'avatar',
          'guardianName',
          'guardianPhone',
          'emergencyContactName',
          'emergencyContactPhone',
        ],
        instituteManaged: [
          'email',
          'phone',
          'studentCode',
          'admissionNumber',
          'rollNumber',
          'organization',
          'education',
          'digitalLibraryLocation',
          'session',
          'courses',
        ],
      },
    };
  }

  private toNumberArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is number =>
        typeof item === 'number' && Number.isFinite(item),
    );
  }

  private humanizeFieldKey(value: string) {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
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

  private async prepareEnrollment(
    dto: CreateStudentDto,
    organizationId?: number | null,
  ) {
    const sessionCourseIds = [
      ...new Set((dto.sessionCourseIds ?? []).map((id) => Number(id))),
    ];
    const hasEnrollmentInput =
      Boolean(dto.sessionId) ||
      sessionCourseIds.length > 0 ||
      Boolean(dto.educationOptionUuid) ||
      Boolean(dto.digitalLibraryLocationUuid);

    if (!hasEnrollmentInput) {
      return null;
    }

    if (!organizationId) {
      throw new BadRequestException('Organization is required');
    }

    if (!dto.sessionId) {
      throw new BadRequestException('Session is required');
    }

    if (!sessionCourseIds.length) {
      throw new BadRequestException('Select at least one course');
    }

    const session = await this.studentsRepository.findEnrollmentSession(
      dto.sessionId,
      organizationId,
    );

    if (!session) {
      throw new BadRequestException('Session is invalid for this organization');
    }

    const selectedCourses =
      await this.studentsRepository.findEnrollmentSessionCourses(
        dto.sessionId,
        sessionCourseIds,
      );

    if (selectedCourses.length !== sessionCourseIds.length) {
      throw new BadRequestException('One or more selected courses are invalid');
    }

    const answers: Record<string, string> = {};

    if (dto.educationOptionUuid) {
      const educationOption = await this.studentsRepository.findEducationOption(
        organizationId,
        dto.educationOptionUuid,
      );

      if (!educationOption) {
        throw new BadRequestException('Education option is invalid');
      }

      answers.education = educationOption.uuid;
    }

    if (dto.digitalLibraryLocationUuid) {
      const digitalLibraryLocation =
        await this.studentsRepository.findDigitalLibraryLocation(
          organizationId,
          dto.digitalLibraryLocationUuid,
        );

      if (!digitalLibraryLocation) {
        throw new BadRequestException('Digital Library Location is invalid');
      }

      answers.digital_library_location = digitalLibraryLocation.uuid;
    }

    const registrationPage =
      dto.educationOptionUuid || dto.digitalLibraryLocationUuid
        ? await this.studentsRepository.findRegistrationPageForSession(
            organizationId,
            dto.sessionId,
          )
        : null;

    return {
      answers: Object.keys(answers).length ? answers : undefined,
      organizationId,
      registrationPageId: registrationPage?.id,
      sessionCourseIds,
      sessionId: dto.sessionId,
    };
  }

  private async resolveManagedOrganizationId(
    actor: CurrentUser | undefined,
    requested?: number | null,
  ) {
    if (!actor || actor.roles?.includes('SUPER_ADMIN')) {
      return requested;
    }

    if (!actor.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    if (requested && requested !== actor.organizationId) {
      throw new ForbiddenException('Cannot manage another organization');
    }

    return actor.organizationId;
  }

  private assertCanAccessStudent(
    actor: CurrentUser | undefined,
    organizationId?: number | null,
  ) {
    if (!actor || actor.roles?.includes('SUPER_ADMIN')) {
      return;
    }

    if (!actor.organizationId || actor.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot access another organization student',
      );
    }
  }

  private normalizeQuery(
    query: StudentQueryDto,
    actor?: CurrentUser,
  ): NormalizedStudentQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status,
      organizationId: actor?.roles?.includes('SUPER_ADMIN')
        ? query.organizationId
        : (actor?.organizationId ?? query.organizationId),
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
      enrollments:
        student.enrollments?.map((enrollment) => ({
          id: enrollment.id,
          session: enrollment.session,
          courses: enrollment.courseEnrollments.map((courseEnrollment) => {
            const sessionCourse = courseEnrollment.sessionCourse;
            return {
              id: sessionCourse.id,
              courseId: sessionCourse.course.id,
              name: sessionCourse.displayName ?? sessionCourse.course.name,
              code: sessionCourse.course.code,
            };
          }),
        })) ?? [],
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
      continuePath: this.buildCoursePath(sessionCourse.id),
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

  private buildCoursePath(sessionCourseId: number) {
    return `/student/my-courses/${sessionCourseId}`;
  }

  private buildResourcePath(sessionCourseId: number, resourceId: number) {
    return `/student/resources?sessionCourseId=${sessionCourseId}&resourceId=${resourceId}`;
  }
}
