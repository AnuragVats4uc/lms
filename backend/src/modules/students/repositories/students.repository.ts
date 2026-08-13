import { Inject, Injectable } from '@nestjs/common';
import { Prisma, StudentStatus, UserStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { StudentQueryDto } from '../dto/student-query.dto';

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
};

export interface NormalizedStudentQuery
  extends Required<
    Omit<StudentQueryDto, 'status' | 'organizationId'>
  > {
  status?: StudentStatus;
  organizationId?: number;
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
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
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
        folder: { sessionCourseId: { in: sessionCourseIds } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        folder: {
          select: {
            id: true,
            sessionCourseId: true,
          },
        },
      },
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
