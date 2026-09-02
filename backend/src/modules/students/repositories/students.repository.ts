import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  ResourceStatus,
  StudentNotificationType,
  StudentStatus,
  UserStatus,
} from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { RESOURCE_TYPE_IDS } from '../../resource/constants/resource-type.constants';
import { StudentQueryDto } from '../dto/student-query.dto';
import { StudentResourcesSort } from '../dto/student-resources-query.dto';
import { StudentNotificationReadStatus } from '../dto/student-notifications-query.dto';
import type {
  NormalizedStudentNotificationsQuery,
  StudentNotificationCreateCandidate,
} from '../student-notification.rules';

export interface StudentCreateData {
  organizationId?: number;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  isVerified?: boolean;
  studentCode?: string;
  admissionNumber?: string;
  rollNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  avatar?: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export type StudentUpdateData = Partial<StudentCreateData> & {
  status?: StudentStatus;
  isActive?: boolean;
  sessionId?: number;
  sessionCourseIds?: number[];
  educationOptionUuid?: string;
  digitalLibraryLocationUuid?: string;
};

export interface NormalizedStudentQuery extends Required<
  Omit<StudentQueryDto, 'status' | 'organizationId'>
> {
  status?: StudentStatus;
  organizationId?: number;
}

export interface NormalizedStudentCoursesQuery {
  page: number;
  limit: number;
  search: string;
  category?: string;
}

export interface NormalizedStudentResourcesQuery {
  page: number;
  limit: number;
  search: string;
  resourceTypeId?: number;
  sessionCourseId?: number;
  folderId?: number;
  uploadedOn?: string;
  status?: ResourceStatus;
  sort: StudentResourcesSort;
}

export interface NormalizedStudentFolderResourcesQuery {
  page: number;
  limit: number;
  search: string;
  resourceTypeId?: number;
  uploadedOn?: string;
  sort: StudentResourcesSort;
}

export interface StudentSelfProfileUpdateData {
  firstName?: string;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  avatar?: string | null;
  avatarObjectId?: number | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface StudentPreferenceUpdateData {
  timezone?: string;
  language?: string;
  inAppNotifications?: boolean;
  emailNotifications?: boolean;
  examReminders?: boolean;
  resourceUpdates?: boolean;
  announcementNotifications?: boolean;
  securityAlerts?: boolean;
  examReminderOffsetsMinutes?: number[];
}

@Injectable()
export class StudentsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async create(data: StudentCreateData) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          isVerified: data.isVerified,
          lastName: data.lastName,
          organizationId: data.organizationId,
          password: data.password,
          phone: data.phone,
        },
      });

      return tx.student.create({
        data: {
          admissionNumber: data.admissionNumber,
          organizationId: data.organizationId,
          rollNumber: data.rollNumber,
          studentCode: data.studentCode ?? this.defaultStudentCode(user.id),
          userId: user.id,
          profile: {
            create: this.toProfileCreateInput(data),
          },
        },
        include: this.includeRelations(),
      });
    });
  }

  findById(id: number) {
    return this.prisma.student.findUnique({
      where: { id },
      include: this.includeRelations(),
    });
  }

  findDashboardStudent(userId: number) {
    return this.prisma.student.findFirst({
      where: {
        isActive: true,
        userId,
        user: {
          isActive: true,
          userRoles: {
            some: {
              isActive: true,
              role: { code: 'STUDENT' },
            },
          },
        },
      },
      select: {
        id: true,
        uuid: true,
        studentCode: true,
        status: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true, code: true },
        },
        profile: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  findSelfProfile(userId: number) {
    return this.prisma.student.findFirst({
      where: {
        userId,
        isActive: true,
        user: { isActive: true },
      },
      include: {
        organization: {
          select: { id: true, uuid: true, name: true, code: true },
        },
        profile: {
          include: {
            avatarObject: {
              select: {
                id: true,
                uuid: true,
                originalFileName: true,
                mimeType: true,
                sizeBytes: true,
                status: true,
              },
            },
          },
        },
        preferences: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            isVerified: true,
            lastLoginAt: true,
          },
        },
        enrollments: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          include: {
            session: {
              select: {
                id: true,
                uuid: true,
                name: true,
                code: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
            courseEnrollments: {
              where: { isActive: true },
              orderBy: { createdAt: 'asc' },
              include: {
                sessionCourse: {
                  select: {
                    id: true,
                    uuid: true,
                    displayName: true,
                    course: {
                      select: { id: true, uuid: true, code: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
        registrationAnswers: {
          orderBy: { updatedAt: 'desc' },
          select: {
            fieldKey: true,
            value: true,
            updatedAt: true,
            field: {
              select: {
                label: true,
                fieldType: true,
                mapsTo: true,
              },
            },
          },
        },
      },
    });
  }

  async updateSelfProfile(
    studentId: number,
    userId: number,
    fallbackFirstName: string,
    data: StudentSelfProfileUpdateData,
  ) {
    const { firstName, lastName, ...profileData } = data;

    return this.prisma.$transaction(async (tx) => {
      if (firstName !== undefined || lastName !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: this.removeUndefined({ firstName, lastName }),
        });
      }

      await tx.studentProfile.upsert({
        where: { studentId },
        create: {
          studentId,
          firstName: firstName ?? fallbackFirstName,
          lastName,
          ...profileData,
        },
        update: this.removeUndefined({
          firstName,
          lastName,
          ...profileData,
        }),
      });

      return tx.student.findUnique({
        where: { id: studentId },
        include: { profile: true },
      });
    });
  }

  upsertStudentPreferences(
    studentId: number,
    data: StudentPreferenceUpdateData = {},
  ) {
    return this.prisma.studentPreference.upsert({
      where: { studentId },
      create: {
        studentId,
        timezone: data.timezone ?? 'Asia/Kolkata',
        language: data.language ?? 'en',
        inAppNotifications: data.inAppNotifications ?? true,
        emailNotifications: data.emailNotifications ?? false,
        examReminders: data.examReminders ?? true,
        resourceUpdates: data.resourceUpdates ?? true,
        announcementNotifications: data.announcementNotifications ?? true,
        securityAlerts: data.securityAlerts ?? true,
        examReminderOffsetsMinutes: data.examReminderOffsetsMinutes ?? [
          1440, 60,
        ],
      },
      update: {
        ...data,
        examReminderOffsetsMinutes: data.examReminderOffsetsMinutes,
      },
    });
  }

  findUserPassword(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
  }

  updatePasswordAndRevokeSessions(userId: number, password: string) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { password } });
      const revokedTokens = await tx.refreshToken.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: {
          status: 'REVOKED',
          revokedAt: now,
          revocationReason: 'FORCED_LOGOUT',
        },
      });
      await tx.userActivitySession.updateMany({
        where: { userId, endedAt: null },
        data: {
          endedAt: now,
          endReason: 'FORCED_LOGOUT',
        },
      });
      return { revokedSessions: revokedTokens.count };
    });
  }

  findActiveEnrollment(studentId: number, organizationId?: number | null) {
    return this.prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        isActive: true,
        status: 'ACTIVE',
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true, code: true } },
        courseEnrollments: {
          where: { isActive: true, status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          include: {
            sessionCourse: {
              include: {
                course: true,
                instructors: {
                  include: {
                    instructor: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
                studentCourseProgress: {
                  where: { studentId },
                  include: {
                    lastAccessedResource: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findNotifications(studentId: number, organizationId: number) {
    return this.prisma.studentNotification.findMany({
      where: {
        studentId,
        organizationId,
        type: {
          in: [
            StudentNotificationType.EXAM,
            StudentNotificationType.RESOURCE,
            StudentNotificationType.ANNOUNCEMENT,
            StudentNotificationType.SYSTEM,
          ],
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async findStudentNotifications(
    studentId: number,
    organizationId: number,
    query: NormalizedStudentNotificationsQuery,
  ) {
    const now = new Date();
    const visibleWhere: Prisma.StudentNotificationWhereInput = {
      studentId,
      organizationId,
      type: { in: query.types as StudentNotificationType[] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
    const filteredWhere: Prisma.StudentNotificationWhereInput = {
      AND: [
        visibleWhere,
        query.status === StudentNotificationReadStatus.ALL
          ? {}
          : {
              isRead: query.status === StudentNotificationReadStatus.READ,
            },
        query.search
          ? {
              OR: [
                { title: { contains: query.search } },
                { description: { contains: query.search } },
              ],
            }
          : {},
      ],
    };
    const skip = (query.page - 1) * query.limit;
    const summaryWhere: Prisma.StudentNotificationWhereInput = {
      studentId,
      organizationId,
      type: {
        in: [
          StudentNotificationType.EXAM,
          StudentNotificationType.RESOURCE,
          StudentNotificationType.ANNOUNCEMENT,
          StudentNotificationType.SYSTEM,
        ],
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [
      items,
      total,
      unread,
      examCount,
      resourceCount,
      announcementCount,
      systemCount,
    ] = await this.prisma.$transaction([
      this.prisma.studentNotification.findMany({
        where: filteredWhere,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.studentNotification.count({ where: filteredWhere }),
      this.prisma.studentNotification.count({
        where: { AND: [summaryWhere, { isRead: false }] },
      }),
      this.prisma.studentNotification.count({
        where: { ...summaryWhere, type: StudentNotificationType.EXAM },
      }),
      this.prisma.studentNotification.count({
        where: { ...summaryWhere, type: StudentNotificationType.RESOURCE },
      }),
      this.prisma.studentNotification.count({
        where: {
          ...summaryWhere,
          type: StudentNotificationType.ANNOUNCEMENT,
        },
      }),
      this.prisma.studentNotification.count({
        where: { ...summaryWhere, type: StudentNotificationType.SYSTEM },
      }),
    ]);

    return {
      items,
      total,
      unread,
      countsByType: {
        EXAM: examCount,
        RESOURCE: resourceCount,
        ANNOUNCEMENT: announcementCount,
        SYSTEM: systemCount,
      },
    };
  }

  countUnreadStudentNotifications(studentId: number, organizationId: number) {
    return this.prisma.studentNotification.count({
      where: {
        studentId,
        organizationId,
        type: {
          in: [
            StudentNotificationType.EXAM,
            StudentNotificationType.RESOURCE,
            StudentNotificationType.ANNOUNCEMENT,
            StudentNotificationType.SYSTEM,
          ],
        },
        isRead: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  async updateStudentNotificationReadState(
    studentId: number,
    organizationId: number,
    notificationUuid: string,
    isRead: boolean,
  ) {
    const result = await this.prisma.studentNotification.updateMany({
      where: {
        uuid: notificationUuid,
        studentId,
        organizationId,
        type: {
          in: [
            StudentNotificationType.EXAM,
            StudentNotificationType.RESOURCE,
            StudentNotificationType.ANNOUNCEMENT,
            StudentNotificationType.SYSTEM,
          ],
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: { isRead },
    });
    if (!result.count) return null;

    return this.prisma.studentNotification.findFirst({
      where: { uuid: notificationUuid, studentId, organizationId },
    });
  }

  markAllStudentNotificationsRead(studentId: number, organizationId: number) {
    return this.prisma.studentNotification.updateMany({
      where: {
        studentId,
        organizationId,
        isRead: false,
        type: {
          in: [
            StudentNotificationType.EXAM,
            StudentNotificationType.RESOURCE,
            StudentNotificationType.ANNOUNCEMENT,
            StudentNotificationType.SYSTEM,
          ],
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: { isRead: true },
    });
  }

  createStudentNotificationsIfMissing(
    studentId: number,
    organizationId: number,
    notifications: StudentNotificationCreateCandidate[],
  ) {
    if (!notifications.length) return Promise.resolve({ count: 0 });

    return this.prisma.studentNotification.createMany({
      data: notifications.map((notification) => ({
        ...notification,
        studentId,
        organizationId,
      })),
      skipDuplicates: true,
    });
  }

  async findRegistrationSelectionNames(
    organizationId: number | null,
    educationUuid?: string,
    digitalLibraryLocationUuid?: string,
  ) {
    if (!organizationId) {
      return { education: null, digitalLibraryLocation: null };
    }

    const [education, digitalLibraryLocation] = await Promise.all([
      educationUuid
        ? this.prisma.organizationEducationOption.findFirst({
            where: { organizationId, uuid: educationUuid },
            select: { uuid: true, name: true },
          })
        : Promise.resolve(null),
      digitalLibraryLocationUuid
        ? this.prisma.organizationDigitalLibraryLocation.findFirst({
            where: { organizationId, uuid: digitalLibraryLocationUuid },
            select: { uuid: true, name: true },
          })
        : Promise.resolve(null),
    ]);

    return { education, digitalLibraryLocation };
  }

  findContentUpdates(sessionCourseIds: number[]) {
    if (!sessionCourseIds.length) {
      return Promise.resolve([]);
    }

    return this.prisma.resource.findMany({
      where: {
        isActive: true,
        isPublished: true,
        status: 'PUBLISHED',
        resourceTypeId: {
          in: [
            RESOURCE_TYPE_IDS.DOCUMENT,
            RESOURCE_TYPE_IDS.VIDEO,
            RESOURCE_TYPE_IDS.EXAM,
          ],
        },
        folder: {
          parentFolderId: null,
          sessionCourseId: { in: sessionCourseIds },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        resourceType: true,
        folder: {
          select: {
            id: true,
            sessionCourseId: true,
          },
        },
      },
    });
  }

  findStudentCalendarExamResources(
    studentId: number,
    organizationId: number,
    range: { from: Date; to: Date },
  ) {
    return this.prisma.resource.findMany({
      where: {
        resourceTypeId: RESOURCE_TYPE_IDS.EXAM,
        isActive: true,
        isPublished: true,
        status: ResourceStatus.PUBLISHED,
        folder: {
          parentFolderId: null,
          isActive: true,
          status: 'ACTIVE',
          sessionCourse: {
            isActive: true,
            isPublished: true,
            status: 'ACTIVE',
            session: { organizationId },
            studentCourseEnrollments: {
              some: {
                isActive: true,
                status: { in: ['ACTIVE', 'COMPLETED'] },
                enrollment: {
                  studentId,
                  organizationId,
                  isActive: true,
                  status: { in: ['ACTIVE', 'COMPLETED'] },
                },
              },
            },
          },
        },
        exam: {
          organizationId,
          isActive: true,
          status: {
            in: ['SCHEDULED', 'LIVE', 'CLOSED', 'CANCELLED'],
          },
          availableFrom: { lt: range.to },
          availableUntil: { gte: range.from },
        },
      },
      orderBy: [{ exam: { availableFrom: 'asc' } }, { id: 'asc' }],
      select: {
        id: true,
        uuid: true,
        title: true,
        description: true,
        exam: {
          select: {
            id: true,
            uuid: true,
            code: true,
            title: true,
            organizationId: true,
            availableFrom: true,
            availableUntil: true,
            durationMinutes: true,
            attemptLimit: true,
            allowResume: true,
            status: true,
            courseAssignments: {
              select: { sessionCourseId: true },
            },
            attempts: {
              where: { studentId },
              orderBy: { attemptNumber: 'desc' },
              select: {
                id: true,
                uuid: true,
                attemptNumber: true,
                status: true,
                expiresAt: true,
                submittedAt: true,
              },
            },
          },
        },
        folder: {
          select: {
            sessionCourseId: true,
            sessionCourse: {
              select: {
                id: true,
                uuid: true,
                displayName: true,
                course: {
                  select: { id: true, uuid: true, code: true, name: true },
                },
                session: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    code: true,
                    organizationId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findStudentCalendarEnrollments(
    studentId: number,
    organizationId: number,
    range: { from: Date; to: Date },
  ) {
    return this.prisma.studentEnrollment.findMany({
      where: {
        studentId,
        organizationId,
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        session: {
          organizationId,
          isActive: true,
          status: { not: 'ARCHIVED' },
          startDate: { lt: range.to },
          endDate: { gte: range.from },
        },
      },
      orderBy: [{ session: { startDate: 'asc' } }, { id: 'asc' }],
      select: {
        id: true,
        status: true,
        session: {
          select: {
            id: true,
            uuid: true,
            name: true,
            code: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        courseEnrollments: {
          where: {
            isActive: true,
            status: { in: ['ACTIVE', 'COMPLETED'] },
            sessionCourse: {
              isActive: true,
              isPublished: true,
              status: 'ACTIVE',
            },
          },
          orderBy: { createdAt: 'asc' },
          select: {
            sessionCourse: {
              select: {
                id: true,
                uuid: true,
                displayName: true,
                course: {
                  select: { id: true, uuid: true, code: true, name: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findStudentCourseEnrollments(
    studentId: number,
    organizationId: number | null | undefined,
    query: NormalizedStudentCoursesQuery,
  ) {
    const where = this.buildStudentCoursesWhere(
      studentId,
      organizationId,
      query,
    );
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.studentCourseEnrollment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: query.limit,
        include: {
          enrollment: {
            select: {
              id: true,
              organization: { select: { id: true, name: true, code: true } },
              session: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  description: true,
                },
              },
            },
          },
          sessionCourse: {
            include: {
              course: true,
              folders: {
                where: {
                  isActive: true,
                  status: 'ACTIVE',
                },
                include: {
                  resources: {
                    where: {
                      isActive: true,
                      isPublished: true,
                      status: 'PUBLISHED',
                    },
                    select: {
                      id: true,
                      title: true,
                      resourceTypeId: true,
                      resourceType: true,
                      documentPageCount: true,
                      createdAt: true,
                      updatedAt: true,
                      videoProgress: {
                        where: { studentId },
                        select: { watchedPercentage: true },
                        take: 1,
                      },
                      exam: {
                        select: {
                          attempts: {
                            where: { studentId },
                            select: { status: true },
                          },
                        },
                      },
                      activitySessions: {
                        where: { studentId },
                        select: {
                          startedAt: true,
                          documentPages: {
                            select: {
                              pageNumber: true,
                              activeDurationSeconds: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              instructors: {
                include: {
                  instructor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
              studentCourseProgress: {
                where: { studentId },
                include: {
                  lastAccessedResource: {
                    select: {
                      id: true,
                      title: true,
                      resourceTypeId: true,
                      resourceType: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.studentCourseEnrollment.count({ where }),
    ]);

    return { items, total };
  }

  async findStudentCourseCategories(
    studentId: number,
    organizationId?: number | null,
  ) {
    const enrollments = await this.prisma.studentCourseEnrollment.findMany({
      where: this.buildStudentCoursesWhere(studentId, organizationId, {
        search: '',
      }),
      select: {
        enrollment: {
          select: {
            session: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return [
      ...new Set(
        enrollments
          .map((enrollment) => enrollment.enrollment.session.name)
          .filter(Boolean),
      ),
    ];
  }

  findStudentCourseFolders(
    studentId: number,
    organizationId: number,
    sessionCourseId: number,
  ) {
    const visibleResourceWhere = this.buildVisibleFolderResourceWhere(
      organizationId,
      sessionCourseId,
    );

    return this.prisma.studentCourseEnrollment.findFirst({
      where: {
        sessionCourseId,
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        enrollment: {
          studentId,
          organizationId,
          isActive: true,
          status: 'ACTIVE',
        },
        sessionCourse: {
          isActive: true,
          isPublished: true,
          status: 'ACTIVE',
          session: { organizationId },
        },
      },
      include: {
        enrollment: {
          select: {
            session: { select: { id: true, code: true, name: true } },
          },
        },
        sessionCourse: {
          include: {
            course: true,
            session: { select: { id: true, code: true, name: true } },
            folders: {
              where: {
                isActive: true,
                status: 'ACTIVE',
              },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
              select: {
                id: true,
                parentFolderId: true,
                name: true,
                description: true,
                icon: true,
                color: true,
                sortOrder: true,
                resources: {
                  where: visibleResourceWhere,
                  select: { id: true, resourceTypeId: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findStudentFolderResources(
    studentId: number,
    organizationId: number,
    sessionCourseId: number,
    folderId: number,
    query: NormalizedStudentFolderResourcesQuery,
  ) {
    const visibleResourceWhere = this.buildVisibleFolderResourceWhere(
      organizationId,
      sessionCourseId,
    );
    const access = await this.prisma.studentCourseEnrollment.findFirst({
      where: {
        sessionCourseId,
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        enrollment: {
          studentId,
          organizationId,
          isActive: true,
          status: 'ACTIVE',
        },
        sessionCourse: {
          isActive: true,
          isPublished: true,
          status: 'ACTIVE',
          session: { organizationId },
          folders: {
            some: {
              id: folderId,
              isActive: true,
              status: 'ACTIVE',
            },
          },
        },
      },
      select: {
        sessionCourse: {
          select: {
            id: true,
            displayName: true,
            description: true,
            course: true,
            session: { select: { id: true, code: true, name: true } },
            folders: {
              where: { isActive: true, status: 'ACTIVE' },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
              select: {
                id: true,
                parentFolderId: true,
                name: true,
                description: true,
                icon: true,
                color: true,
                sortOrder: true,
                resources: {
                  where: visibleResourceWhere,
                  select: { id: true, resourceTypeId: true },
                },
              },
            },
          },
        },
      },
    });

    if (
      !access?.sessionCourse.folders.some((folder) => folder.id === folderId)
    ) {
      return null;
    }

    const search = query.search.trim();
    const uploadedAt = query.uploadedOn
      ? new Date(`${query.uploadedOn}T00:00:00.000Z`)
      : undefined;
    const uploadedBefore = uploadedAt
      ? new Date(uploadedAt.getTime() + 24 * 60 * 60 * 1000)
      : undefined;
    const where: Prisma.ResourceWhereInput = {
      folderId,
      ...(query.resourceTypeId ? { resourceTypeId: query.resourceTypeId } : {}),
      ...(uploadedAt && uploadedBefore
        ? { createdAt: { gte: uploadedAt, lt: uploadedBefore } }
        : {}),
      AND: [
        visibleResourceWhere,
        ...(search
          ? [
              {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                ],
              },
            ]
          : []),
      ],
    };
    const skip = (query.page - 1) * query.limit;
    const orderBy = this.studentResourcesOrderBy(query.sort);

    const [items, total, videos, documents, exams] =
      await this.prisma.$transaction([
        this.prisma.resource.findMany({
          where,
          orderBy,
          skip,
          take: query.limit,
          include: {
            resourceType: true,
            videoProgress: {
              where: { studentId },
              take: 1,
            },
            exam: {
              include: {
                attempts: {
                  where: { studentId },
                  orderBy: { attemptNumber: 'desc' },
                },
                courseAssignments: {
                  select: { sessionCourseId: true },
                },
                selectedSlots: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    templateSlot: {
                      include: {
                        sections: {
                          where: { isActive: true },
                          orderBy: { sortOrder: 'asc' },
                          include: {
                            subjects: {
                              orderBy: { sortOrder: 'asc' },
                              include: {
                                subject: true,
                                questions: {
                                  orderBy: { sortOrder: 'asc' },
                                  select: {
                                    id: true,
                                    marks: true,
                                    negativeMarks: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.resource.count({ where }),
        this.prisma.resource.count({
          where: {
            AND: [where, { resourceTypeId: RESOURCE_TYPE_IDS.VIDEO }],
          },
        }),
        this.prisma.resource.count({
          where: {
            AND: [where, { resourceTypeId: RESOURCE_TYPE_IDS.DOCUMENT }],
          },
        }),
        this.prisma.resource.count({
          where: {
            AND: [where, { resourceTypeId: RESOURCE_TYPE_IDS.EXAM }],
          },
        }),
      ]);

    return {
      access,
      documents,
      exams,
      items,
      total,
      videos,
    };
  }

  async findStudentResources(
    studentId: number,
    organizationId: number | null | undefined,
    query: NormalizedStudentResourcesQuery,
  ) {
    const where = this.buildStudentResourcesWhere(
      studentId,
      organizationId,
      query,
    );
    const skip = (query.page - 1) * query.limit;
    const orderBy = this.studentResourcesOrderBy(query.sort);

    const [items, total, videos, documents, exams] =
      await this.prisma.$transaction([
        this.prisma.resource.findMany({
          where,
          orderBy,
          skip,
          take: query.limit,
          include: {
            resourceType: true,
            exam: {
              select: {
                id: true,
                status: true,
                availableFrom: true,
                availableUntil: true,
                durationMinutes: true,
                attemptLimit: true,
                courseAssignments: { select: { sessionCourseId: true } },
              },
            },
            folder: {
              select: {
                id: true,
                name: true,
                sessionCourse: {
                  select: {
                    id: true,
                    displayName: true,
                    course: {
                      select: { id: true, code: true, name: true },
                    },
                    session: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.resource.count({ where }),
        this.prisma.resource.count({
          where: {
            AND: [where, { resourceTypeId: RESOURCE_TYPE_IDS.VIDEO }],
          },
        }),
        this.prisma.resource.count({
          where: {
            AND: [where, { resourceTypeId: RESOURCE_TYPE_IDS.DOCUMENT }],
          },
        }),
        this.prisma.resource.count({
          where: {
            AND: [where, { resourceTypeId: RESOURCE_TYPE_IDS.EXAM }],
          },
        }),
      ]);

    return { documents, exams, items, total, videos };
  }

  findStudentResourceById(
    studentId: number,
    organizationId: number | null | undefined,
    resourceId: number,
  ) {
    return this.prisma.resource.findFirst({
      where: {
        id: resourceId,
        ...this.buildStudentResourcesWhere(studentId, organizationId, {
          search: '',
          status: ResourceStatus.PUBLISHED,
        }),
      },
      include: {
        resourceType: true,
        documentObject: {
          select: {
            id: true,
            uuid: true,
            originalFileName: true,
            mimeType: true,
            sizeBytes: true,
            status: true,
          },
        },
        exam: {
          include: {
            attempts: {
              where: { studentId },
              orderBy: { attemptNumber: 'desc' },
            },
            courseAssignments: { select: { sessionCourseId: true } },
            selectedSlots: {
              orderBy: { sortOrder: 'asc' },
              include: {
                templateSlot: {
                  include: {
                    sections: {
                      where: { isActive: true },
                      orderBy: { sortOrder: 'asc' },
                      include: {
                        subjects: {
                          orderBy: { sortOrder: 'asc' },
                          include: {
                            subject: true,
                            questions: {
                              orderBy: { sortOrder: 'asc' },
                              select: {
                                id: true,
                                marks: true,
                                negativeMarks: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        folder: {
          include: {
            sessionCourse: {
              include: {
                course: true,
                session: {
                  include: {
                    organization: {
                      select: { id: true, name: true, code: true },
                    },
                  },
                },
                studentCourseProgress: {
                  where: { studentId },
                  take: 1,
                },
                instructors: {
                  orderBy: { createdAt: 'asc' },
                  take: 1,
                  select: {
                    instructor: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findFolderResourceSequence(folderId: number) {
    return this.prisma.resource.findMany({
      where: {
        folderId,
        isActive: true,
        isPublished: true,
        status: ResourceStatus.PUBLISHED,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        resourceTypeId: true,
        resourceType: true,
        documentUrl: true,
        videoUrl: true,
        thumbnail: true,
        mimeType: true,
        createdAt: true,
      },
    });
  }

  async findStudentCourseResourceSequence(sessionCourseId: number) {
    const folders = await this.prisma.folder.findMany({
      where: {
        sessionCourseId,
        parentFolderId: null,
        isActive: true,
        status: 'ACTIVE',
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: {
        resources: {
          where: {
            isActive: true,
            isPublished: true,
            status: ResourceStatus.PUBLISHED,
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            title: true,
            resourceTypeId: true,
            resourceType: true,
            thumbnail: true,
            mimeType: true,
            durationInSeconds: true,
          },
        },
      },
    });

    return folders.flatMap((folder) => folder.resources);
  }

  findStudentVideoProgress(studentId: number, resourceId: number) {
    return this.prisma.studentVideoProgress.findUnique({
      where: {
        studentId_resourceId: { studentId, resourceId },
      },
    });
  }

  upsertStudentVideoProgress(
    studentId: number,
    resourceId: number,
    data: {
      currentPositionSeconds: number;
      watchedPercentage: number;
      completedAt: Date | null;
    },
  ) {
    return this.prisma.studentVideoProgress.upsert({
      where: {
        studentId_resourceId: { studentId, resourceId },
      },
      create: { studentId, resourceId, ...data },
      update: data,
    });
  }

  upsertStudentResourceAccess(
    studentId: number,
    sessionCourseId: number,
    resourceId: number,
  ) {
    return this.prisma.studentCourseProgress.upsert({
      where: {
        studentId_sessionCourseId: { studentId, sessionCourseId },
      },
      create: {
        studentId,
        sessionCourseId,
        lastAccessedResourceId: resourceId,
      },
      update: { lastAccessedResourceId: resourceId },
    });
  }

  updateDocumentPageCount(resourceId: number, totalPages: number) {
    return this.prisma.resource.updateMany({
      where: {
        id: resourceId,
        OR: [
          { documentPageCount: null },
          { documentPageCount: { not: totalPages } },
        ],
      },
      data: { documentPageCount: totalPages },
    });
  }

  findStudentDocumentActivity(studentId: number, resourceId: number) {
    return this.prisma.studentResourceActivitySession.findMany({
      where: {
        studentId,
        resourceId,
        resourceTypeCodeSnapshot: 'DOCUMENT',
      },
      orderBy: { startedAt: 'desc' },
      select: {
        startedAt: true,
        lastHeartbeatAt: true,
        lastDocumentPage: true,
        documentPages: {
          select: {
            pageNumber: true,
            activeDurationSeconds: true,
          },
        },
      },
    });
  }

  async findStudentResourceOptions(
    studentId: number,
    organizationId: number | null | undefined,
  ) {
    return this.prisma.studentCourseEnrollment.findMany({
      where: {
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        enrollment: {
          studentId,
          isActive: true,
          status: 'ACTIVE',
          ...(organizationId ? { organizationId } : {}),
        },
        sessionCourse: {
          isActive: true,
          isPublished: true,
          status: 'ACTIVE',
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        sessionCourse: {
          select: {
            id: true,
            displayName: true,
            course: { select: { name: true } },
            folders: {
              where: {
                parentFolderId: null,
                isActive: true,
                status: 'ACTIVE',
                resources: {
                  some: {
                    isActive: true,
                    isPublished: true,
                    status: ResourceStatus.PUBLISHED,
                  },
                },
              },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  findEnrollmentSession(sessionId: number, organizationId: number) {
    return this.prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId,
        isActive: true,
        status: { not: 'ARCHIVED' },
      },
      select: { id: true, organizationId: true, name: true },
    });
  }

  findEnrollmentSessionCourses(sessionId: number, ids: number[]) {
    return this.prisma.sessionCourse.findMany({
      where: {
        id: { in: ids },
        sessionId,
        isActive: true,
        isPublished: true,
        status: 'ACTIVE',
        course: {
          isActive: true,
          status: 'ACTIVE',
        },
      },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  findEducationOption(organizationId: number, uuid: string) {
    return this.prisma.organizationEducationOption.findFirst({
      where: { organizationId, uuid, isActive: true },
      select: { id: true, uuid: true, name: true },
    });
  }

  findDigitalLibraryLocation(organizationId: number, uuid: string) {
    return this.prisma.organizationDigitalLibraryLocation.findFirst({
      where: { organizationId, uuid, isActive: true },
      select: { id: true, uuid: true, name: true },
    });
  }

  findRegistrationPageForSession(organizationId: number, sessionId: number) {
    return this.prisma.organizationRegistrationPage.findFirst({
      where: {
        organizationId,
        sessionId,
        isActive: true,
        status: { not: 'ARCHIVED' },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
  }

  async upsertEnrollment(data: {
    studentId: number;
    organizationId: number;
    sessionId: number;
    sessionCourseIds: number[];
    registrationPageId?: number;
    answers?: Record<string, string>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.studentEnrollment.upsert({
        where: {
          studentId_sessionId: {
            studentId: data.studentId,
            sessionId: data.sessionId,
          },
        },
        create: {
          organizationId: data.organizationId,
          sessionId: data.sessionId,
          studentId: data.studentId,
        },
        update: {
          isActive: true,
          status: 'ACTIVE',
        },
      });

      await Promise.all(
        data.sessionCourseIds.map((sessionCourseId) =>
          tx.studentCourseEnrollment.upsert({
            where: {
              enrollmentId_sessionCourseId: {
                enrollmentId: enrollment.id,
                sessionCourseId,
              },
            },
            create: {
              enrollmentId: enrollment.id,
              sessionCourseId,
            },
            update: {
              isActive: true,
              status: 'ACTIVE',
            },
          }),
        ),
      );

      if (data.registrationPageId && data.answers) {
        await Promise.all(
          Object.entries(data.answers).map(([fieldKey, value]) =>
            tx.organizationRegistrationAnswer.upsert({
              where: {
                registrationPageId_studentId_fieldKey: {
                  registrationPageId: data.registrationPageId as number,
                  studentId: data.studentId,
                  fieldKey,
                },
              },
              create: {
                registrationPageId: data.registrationPageId as number,
                studentId: data.studentId,
                fieldKey,
                value,
              },
              update: { value },
            }),
          ),
        );
      }

      return enrollment;
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  findByEmailExcludingId(email: string, id: number) {
    return this.prisma.user.findFirst({
      where: {
        email,
        student: { id: { not: id } },
      },
    });
  }

  findByPhoneExcludingId(phone: string, id: number) {
    return this.prisma.user.findFirst({
      where: {
        phone,
        student: { id: { not: id } },
      },
    });
  }

  async findMany(query: NormalizedStudentQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { items, total };
  }

  update(id: number, data: StudentUpdateData) {
    const {
      email,
      firstName,
      isVerified,
      lastName,
      password,
      phone,
      organizationId,
      studentCode,
      admissionNumber,
      rollNumber,
      status,
      isActive,
      sessionId: _sessionId,
      sessionCourseIds: _sessionCourseIds,
      educationOptionUuid: _educationOptionUuid,
      digitalLibraryLocationUuid: _digitalLibraryLocationUuid,
      ...profileData
    } = data;

    return this.prisma.student.update({
      where: { id },
      data: {
        admissionNumber,
        isActive,
        organization: this.toOrganizationRelation(organizationId),
        rollNumber,
        status,
        studentCode,
        profile: {
          upsert: {
            create: this.toProfileCreateInput({
              firstName: firstName ?? '',
              lastName,
              phone,
              ...profileData,
            }),
            update: this.removeUndefined({
              firstName,
              lastName,
              phone,
              ...profileData,
            }),
          },
        },
        user: {
          update: this.removeUndefined({
            email,
            firstName,
            isActive,
            isVerified,
            lastName,
            organization: this.toOrganizationRelation(organizationId),
            password,
            phone,
            status: isActive === false ? UserStatus.INACTIVE : undefined,
          }),
        },
      },
      include: this.includeRelations(),
    });
  }

  softDelete(id: number) {
    return this.prisma.student.update({
      where: { id },
      data: {
        isActive: false,
        status: StudentStatus.INACTIVE,
        user: {
          update: {
            isActive: false,
            status: UserStatus.INACTIVE,
          },
        },
      },
      include: this.includeRelations(),
    });
  }

  private includeRelations() {
    return {
      enrollments: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' as const },
        include: {
          session: {
            select: { id: true, name: true, code: true, status: true },
          },
          courseEnrollments: {
            where: { isActive: true },
            include: {
              sessionCourse: {
                select: {
                  id: true,
                  displayName: true,
                  course: {
                    select: { id: true, code: true, name: true },
                  },
                },
              },
            },
          },
        },
      },
      organization: true,
      profile: true,
      user: {
        select: {
          createdAt: true,
          email: true,
          firstName: true,
          id: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true,
          lastName: true,
          organizationId: true,
          phone: true,
          status: true,
          updatedAt: true,
          uuid: true,
          userRoles: {
            where: { isActive: true },
            include: { role: true },
          },
        },
      },
    };
  }

  private buildWhere(query: NormalizedStudentQuery) {
    const where: Prisma.StudentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    const search = query.search.trim();

    if (search) {
      where.OR = [
        { studentCode: { contains: search } },
        { admissionNumber: { contains: search } },
        { rollNumber: { contains: search } },
        { profile: { firstName: { contains: search } } },
        { profile: { lastName: { contains: search } } },
        { user: { email: { contains: search.toLowerCase() } } },
      ];
    }

    return where;
  }

  private buildStudentCoursesWhere(
    studentId: number,
    organizationId: number | null | undefined,
    query: Pick<NormalizedStudentCoursesQuery, 'search' | 'category'>,
  ): Prisma.StudentCourseEnrollmentWhereInput {
    const search = query.search.trim();

    return {
      isActive: true,
      status: { in: ['ACTIVE', 'COMPLETED'] },
      enrollment: {
        studentId,
        isActive: true,
        status: 'ACTIVE',
        ...(organizationId ? { organizationId } : {}),
        ...(query.category ? { session: { name: query.category } } : {}),
      },
      sessionCourse: {
        isActive: true,
        isPublished: true,
        status: 'ACTIVE',
        ...(search
          ? {
              OR: [
                { displayName: { contains: search } },
                { description: { contains: search } },
                { course: { name: { contains: search } } },
                { course: { code: { contains: search } } },
                { course: { description: { contains: search } } },
                { session: { name: { contains: search } } },
              ],
            }
          : {}),
      },
    };
  }

  private buildStudentResourcesWhere(
    studentId: number,
    organizationId: number | null | undefined,
    query: Omit<NormalizedStudentResourcesQuery, 'page' | 'limit' | 'sort'>,
  ): Prisma.ResourceWhereInput {
    const search = query.search.trim();
    const uploadedAt = query.uploadedOn
      ? new Date(`${query.uploadedOn}T00:00:00.000Z`)
      : undefined;
    const uploadedBefore = uploadedAt
      ? new Date(uploadedAt.getTime() + 24 * 60 * 60 * 1000)
      : undefined;

    return {
      isActive: true,
      isPublished: true,
      status: query.status ?? ResourceStatus.PUBLISHED,
      ...(query.resourceTypeId ? { resourceTypeId: query.resourceTypeId } : {}),
      ...(query.folderId ? { folderId: query.folderId } : {}),
      ...(uploadedAt && uploadedBefore
        ? { createdAt: { gte: uploadedAt, lt: uploadedBefore } }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
      folder: {
        parentFolderId: null,
        isActive: true,
        status: 'ACTIVE',
        sessionCourse: {
          ...(query.sessionCourseId ? { id: query.sessionCourseId } : {}),
          isActive: true,
          isPublished: true,
          status: 'ACTIVE',
          studentCourseEnrollments: {
            some: {
              isActive: true,
              status: { in: ['ACTIVE', 'COMPLETED'] },
              enrollment: {
                studentId,
                isActive: true,
                status: 'ACTIVE',
                ...(organizationId ? { organizationId } : {}),
              },
            },
          },
        },
      },
    };
  }

  private buildVisibleFolderResourceWhere(
    organizationId: number,
    sessionCourseId: number,
  ): Prisma.ResourceWhereInput {
    return {
      isActive: true,
      isPublished: true,
      status: ResourceStatus.PUBLISHED,
      OR: [
        { resourceTypeId: { not: RESOURCE_TYPE_IDS.EXAM } },
        {
          resourceTypeId: RESOURCE_TYPE_IDS.EXAM,
          exam: {
            organizationId,
            isActive: true,
            status: { in: ['SCHEDULED', 'LIVE', 'CLOSED'] },
            courseAssignments: { some: { sessionCourseId } },
          },
        },
      ],
    };
  }

  private studentResourcesOrderBy(
    sort: StudentResourcesSort,
  ): Prisma.ResourceOrderByWithRelationInput[] {
    if (sort === StudentResourcesSort.OLDEST) {
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    }
    if (sort === StudentResourcesSort.TITLE_ASC) {
      return [{ title: 'asc' }, { id: 'asc' }];
    }
    if (sort === StudentResourcesSort.TITLE_DESC) {
      return [{ title: 'desc' }, { id: 'desc' }];
    }
    return [{ createdAt: 'desc' }, { id: 'desc' }];
  }

  private defaultStudentCode(userId: number) {
    return `STU-${userId}`;
  }

  private toOrganizationRelation(organizationId?: number) {
    if (organizationId === undefined) {
      return undefined;
    }

    return organizationId
      ? { connect: { id: organizationId } }
      : { disconnect: true };
  }

  private toProfileCreateInput(data: {
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    alternatePhone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    avatar?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
  }) {
    return {
      address: data.address,
      alternatePhone: data.alternatePhone,
      avatar: data.avatar,
      city: data.city,
      dateOfBirth: data.dateOfBirth,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      firstName: data.firstName,
      gender: data.gender,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      lastName: data.lastName,
      phone: data.phone,
      postalCode: data.postalCode,
      state: data.state,
    };
  }

  private removeUndefined<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
}
