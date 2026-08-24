import { Injectable } from '@nestjs/common';
import { Prisma, ResourceStatus } from '@prisma/client';

import { PrismaService } from '../../prisma';
import {
  TeacherCoursesQueryDto,
  TeacherResourcesQueryDto,
  TeacherStudentsQueryDto,
} from './dto/teacher-query.dto';

@Injectable()
export class TeacherDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAssignedCourses(teacherId: number, organizationId: number) {
    return this.prisma.courseInstructor.findMany({
      where: {
        instructorId: teacherId,
        sessionCourse: {
          isActive: true,
          session: {
            organizationId,
            isActive: true,
          },
          course: {
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sessionCourse: {
          include: {
            course: true,
            session: true,
          },
        },
      },
    });
  }

  async countDistinctStudents(
    sessionCourseIds: number[],
    organizationId: number,
  ) {
    if (!sessionCourseIds.length) return 0;

    const rows = await this.prisma.studentEnrollment.findMany({
      where: {
        organizationId,
        isActive: true,
        status: 'ACTIVE',
        courseEnrollments: {
          some: {
            sessionCourseId: { in: sessionCourseIds },
            isActive: true,
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
        },
      },
      distinct: ['studentId'],
      select: { studentId: true },
    });

    return rows.length;
  }

  countCourseEnrollments(sessionCourseIds: number[], organizationId: number) {
    if (!sessionCourseIds.length) return Promise.resolve(0);

    return this.prisma.studentCourseEnrollment.count({
      where: {
        sessionCourseId: { in: sessionCourseIds },
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        enrollment: {
          organizationId,
          isActive: true,
          status: 'ACTIVE',
        },
      },
    });
  }

  countFolders(sessionCourseIds: number[]) {
    if (!sessionCourseIds.length) return Promise.resolve(0);

    return this.prisma.folder.count({
      where: {
        sessionCourseId: { in: sessionCourseIds },
        isActive: true,
        status: 'ACTIVE',
      },
    });
  }

  countResources(sessionCourseIds: number[]) {
    if (!sessionCourseIds.length) return Promise.resolve(0);

    return this.prisma.resource.count({
      where: this.resourceScope(sessionCourseIds),
    });
  }

  countPublishedResources(sessionCourseIds: number[]) {
    if (!sessionCourseIds.length) return Promise.resolve(0);

    return this.prisma.resource.count({
      where: {
        ...this.resourceScope(sessionCourseIds),
        isPublished: true,
        status: ResourceStatus.PUBLISHED,
      },
    });
  }

  countResourcesByType(sessionCourseIds: number[]) {
    return this.prisma.resource.groupBy({
      by: ['resourceTypeId'],
      where: this.resourceScope(sessionCourseIds),
      _count: { _all: true },
    });
  }

  findResourceTypes() {
    return this.prisma.resourceType.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { id: 'asc' },
    });
  }

  findCourseSummaries(sessionCourseIds: number[], organizationId: number) {
    return this.prisma.sessionCourse.findMany({
      where: {
        id: { in: sessionCourseIds },
        isActive: true,
        session: { organizationId },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        course: true,
        session: true,
        folders: {
          where: { isActive: true, status: 'ACTIVE' },
          select: {
            id: true,
            resources: {
              where: { isActive: true },
              select: {
                id: true,
                isPublished: true,
                status: true,
                resourceType: { select: { code: true } },
              },
            },
          },
        },
        studentCourseEnrollments: {
          where: {
            isActive: true,
            status: { in: ['ACTIVE', 'COMPLETED'] },
            enrollment: {
              organizationId,
              isActive: true,
              status: 'ACTIVE',
            },
          },
          select: { id: true },
        },
      },
    });
  }

  findCourseList(
    teacherId: number,
    organizationId: number,
    query: Required<Pick<TeacherCoursesQueryDto, 'page' | 'limit'>> &
      Pick<TeacherCoursesQueryDto, 'search' | 'status'>,
  ) {
    const where = this.assignedCourseScope(
      teacherId,
      organizationId,
      query.search,
      query.status,
    );
    const skip = (query.page - 1) * query.limit;

    return this.prisma.$transaction([
      this.prisma.sessionCourse.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: query.limit,
        include: {
          course: true,
          session: true,
          folders: {
            where: { isActive: true, status: 'ACTIVE' },
            select: {
              id: true,
              resources: {
                where: { isActive: true },
                select: {
                  id: true,
                  isPublished: true,
                  status: true,
                  resourceType: { select: { code: true } },
                },
              },
            },
          },
          studentCourseEnrollments: {
            where: {
              isActive: true,
              status: { in: ['ACTIVE', 'COMPLETED'] },
              enrollment: {
                organizationId,
                isActive: true,
                status: 'ACTIVE',
              },
            },
            select: { id: true },
          },
        },
      }),
      this.prisma.sessionCourse.count({ where }),
    ]);
  }

  findResourceList(
    sessionCourseIds: number[],
    query: Required<Pick<TeacherResourcesQueryDto, 'page' | 'limit'>> &
      Pick<
        TeacherResourcesQueryDto,
        'published' | 'resourceTypeId' | 'search' | 'sessionCourseId' | 'status'
      >,
  ) {
    const where = this.resourceListScope(sessionCourseIds, query);
    const skip = (query.page - 1) * query.limit;

    return this.prisma.$transaction([
      this.prisma.resource.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
        include: {
          resourceType: true,
          folder: {
            select: {
              id: true,
              name: true,
              sessionCourse: {
                select: {
                  id: true,
                  displayName: true,
                  course: { select: { id: true, name: true, code: true } },
                  session: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.resource.count({ where }),
    ]);
  }

  findStudentList(
    sessionCourseIds: number[],
    organizationId: number,
    query: Required<Pick<TeacherStudentsQueryDto, 'page' | 'limit'>> &
      Pick<TeacherStudentsQueryDto, 'search' | 'sessionCourseId'>,
  ) {
    const where = this.studentListScope(sessionCourseIds, organizationId, query);
    const skip = (query.page - 1) * query.limit;

    return this.prisma.$transaction([
      this.prisma.studentCourseEnrollment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.limit,
        include: {
          enrollment: {
            select: {
              id: true,
              uuid: true,
              status: true,
              isActive: true,
              createdAt: true,
              student: {
                select: {
                  id: true,
                  uuid: true,
                  studentCode: true,
                  status: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                    },
                  },
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      phone: true,
                      gender: true,
                    },
                  },
                },
              },
            },
          },
          sessionCourse: {
            select: {
              id: true,
              displayName: true,
              course: { select: { id: true, name: true, code: true } },
              session: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      this.prisma.studentCourseEnrollment.count({ where }),
    ]);
  }

  findRecentResources(sessionCourseIds: number[], take = 6) {
    return this.prisma.resource.findMany({
      where: this.resourceScope(sessionCourseIds),
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take,
      include: {
        resourceType: true,
        folder: {
          select: {
            id: true,
            name: true,
            sessionCourse: {
              select: {
                id: true,
                displayName: true,
                course: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });
  }

  findRecentStudents(
    sessionCourseIds: number[],
    organizationId: number,
    take = 6,
  ) {
    return this.prisma.studentCourseEnrollment.findMany({
      where: {
        sessionCourseId: { in: sessionCourseIds },
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        enrollment: {
          organizationId,
          isActive: true,
          status: 'ACTIVE',
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                id: true,
                uuid: true,
                studentCode: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        sessionCourse: {
          select: {
            id: true,
            displayName: true,
            course: { select: { name: true } },
          },
        },
      },
    });
  }

  private resourceScope(sessionCourseIds: number[]): Prisma.ResourceWhereInput {
    return {
      isActive: true,
      folder: {
        sessionCourseId: { in: sessionCourseIds },
        isActive: true,
        sessionCourse: {
          isActive: true,
        },
      },
    };
  }

  private assignedCourseScope(
    teacherId: number,
    organizationId: number,
    search?: string,
    status?: TeacherCoursesQueryDto['status'],
  ): Prisma.SessionCourseWhereInput {
    const normalizedSearch = search?.trim();

    return {
      isActive: true,
      ...(status ? { status } : {}),
      instructors: { some: { instructorId: teacherId } },
      session: {
        organizationId,
        isActive: true,
      },
      course: {
        isActive: true,
      },
      ...(normalizedSearch
        ? {
            OR: [
              { displayName: { contains: normalizedSearch } },
              { description: { contains: normalizedSearch } },
              { course: { name: { contains: normalizedSearch } } },
              { course: { code: { contains: normalizedSearch } } },
              { course: { description: { contains: normalizedSearch } } },
              { session: { name: { contains: normalizedSearch } } },
              { session: { code: { contains: normalizedSearch } } },
            ],
          }
        : {}),
    };
  }

  private resourceListScope(
    sessionCourseIds: number[],
    query: Pick<
      TeacherResourcesQueryDto,
      'published' | 'resourceTypeId' | 'search' | 'sessionCourseId' | 'status'
    >,
  ): Prisma.ResourceWhereInput {
    const normalizedSearch = query.search?.trim();
    const scopedSessionCourseIds = query.sessionCourseId
      ? sessionCourseIds.filter((id) => id === query.sessionCourseId)
      : sessionCourseIds;

    return {
      isActive: true,
      ...(query.status ? { status: query.status } : {}),
      ...(query.published !== undefined ? { isPublished: query.published } : {}),
      ...(query.resourceTypeId ? { resourceTypeId: query.resourceTypeId } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { title: { contains: normalizedSearch } },
              { description: { contains: normalizedSearch } },
              { folder: { name: { contains: normalizedSearch } } },
              {
                folder: {
                  sessionCourse: {
                    course: { name: { contains: normalizedSearch } },
                  },
                },
              },
              {
                folder: {
                  sessionCourse: {
                    course: { code: { contains: normalizedSearch } },
                  },
                },
              },
            ],
          }
        : {}),
      folder: {
        sessionCourseId: { in: scopedSessionCourseIds },
        isActive: true,
        sessionCourse: {
          isActive: true,
        },
      },
    };
  }

  private studentListScope(
    sessionCourseIds: number[],
    organizationId: number,
    query: Pick<TeacherStudentsQueryDto, 'search' | 'sessionCourseId'>,
  ): Prisma.StudentCourseEnrollmentWhereInput {
    const normalizedSearch = query.search?.trim();
    const scopedSessionCourseIds = query.sessionCourseId
      ? sessionCourseIds.filter((id) => id === query.sessionCourseId)
      : sessionCourseIds;

    return {
      sessionCourseId: { in: scopedSessionCourseIds },
      isActive: true,
      status: { in: ['ACTIVE', 'COMPLETED'] },
      enrollment: {
        organizationId,
        isActive: true,
        status: 'ACTIVE',
        student: {
          isActive: true,
          ...(normalizedSearch
            ? {
                OR: [
                  { studentCode: { contains: normalizedSearch } },
                  { admissionNumber: { contains: normalizedSearch } },
                  { rollNumber: { contains: normalizedSearch } },
                  { user: { firstName: { contains: normalizedSearch } } },
                  { user: { lastName: { contains: normalizedSearch } } },
                  { user: { email: { contains: normalizedSearch } } },
                  { user: { phone: { contains: normalizedSearch } } },
                  { profile: { firstName: { contains: normalizedSearch } } },
                  { profile: { lastName: { contains: normalizedSearch } } },
                  { profile: { phone: { contains: normalizedSearch } } },
                ],
              }
            : {}),
        },
      },
    };
  }
}
