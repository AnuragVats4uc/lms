import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma';

export interface DashboardScope {
  organizationId?: number;
  sessionId?: number;
  sessionCourseId?: number;
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findContext(scope: DashboardScope) {
    return this.prisma.organization.findFirst({
      where: {
        ...(scope.organizationId ? { id: scope.organizationId } : {}),
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sessions: {
          where: {
            ...(scope.sessionId ? { id: scope.sessionId } : {}),
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: {
            sessionCourses: {
              where: {
                ...(scope.sessionCourseId ? { id: scope.sessionCourseId } : {}),
                isActive: true,
              },
              orderBy: { sortOrder: 'asc' },
              take: 1,
              include: { course: true },
            },
          },
        },
      },
    });
  }

  countStatistics(scope: DashboardScope) {
    const organizationWhere: Prisma.OrganizationWhereInput = {
      ...(scope.organizationId ? { id: scope.organizationId } : {}),
    };
    const sessionWhere: Prisma.SessionWhereInput = {
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
    };
    const sessionCourseWhere: Prisma.SessionCourseWhereInput = {
      ...(scope.organizationId
        ? { session: { organizationId: scope.organizationId } }
        : {}),
    };
    const folderWhere: Prisma.FolderWhereInput = {
      ...(scope.organizationId
        ? { sessionCourse: { session: { organizationId: scope.organizationId } } }
        : {}),
    };
    const resourceWhere: Prisma.ResourceWhereInput = {
      ...(scope.organizationId
        ? {
            folder: {
              sessionCourse: { session: { organizationId: scope.organizationId } },
            },
          }
        : {}),
    };
    const userWhere: Prisma.UserWhereInput = {
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
    };

    return Promise.all([
      this.countMetric('organization', organizationWhere, 'isActive'),
      this.countMetric('session', sessionWhere, 'isActive'),
      this.countMetric('course', {}, 'isActive'),
      this.countMetric('sessionCourse', sessionCourseWhere, 'isActive'),
      this.countMetric('folder', folderWhere, 'isActive'),
      this.countMetric('resource', resourceWhere, 'isActive'),
      this.countMetric('user', userWhere, 'isActive'),
      this.countMetric('role', {}, 'isActive'),
      this.prisma.permission.count(),
    ]).then(([organizations, sessions, courses, sessionCourses, folders, resources, users, roles, permissions]) => ({
      organizations,
      sessions,
      courses,
      sessionCourses,
      folders,
      resources,
      users,
      roles,
      permissions,
    }));
  }

  findFolders(sessionCourseId: number) {
    return this.prisma.folder.findMany({
      where: { sessionCourseId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        parentFolderId: true,
        name: true,
        description: true,
        updatedAt: true,
        _count: { select: { children: true, resources: true } },
      },
    });
  }

  findRoles() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        _count: { select: { permissions: true, userRoles: true } },
      },
    });
  }

  private countMetric<
    T extends 'organization' | 'session' | 'course' | 'sessionCourse' | 'folder' | 'resource' | 'user' | 'role',
  >(model: T, where: object, activeField: 'isActive') {
    const delegate = this.prisma[model] as unknown as {
      count: (args: { where: object }) => Prisma.PrismaPromise<number>;
    };

    return Promise.all([
      delegate.count({ where }),
      delegate.count({ where: { ...where, [activeField]: true } }),
      delegate.count({ where: { ...where, [activeField]: false } }),
    ]).then(([total, active, inactive]) => ({ total, active, inactive }));
  }
}
