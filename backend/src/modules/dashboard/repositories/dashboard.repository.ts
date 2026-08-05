import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma';

export interface DashboardScope {
  organizationId?: number;
  sessionId?: number;
  sessionCourseId?: number;
  folderId?: number;
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findContext(scope: DashboardScope) {
    const sessionWhere: Prisma.SessionWhereInput = {
      ...(scope.sessionId ? { id: scope.sessionId } : {}),
      ...(scope.sessionCourseId
        ? { sessionCourses: { some: { id: scope.sessionCourseId } } }
        : {}),
      isActive: true,
    };
    const sessionCourseWhere: Prisma.SessionCourseWhereInput = {
      ...(scope.sessionCourseId ? { id: scope.sessionCourseId } : {}),
      ...(scope.folderId ? { folders: { some: { id: scope.folderId } } } : {}),
      isActive: true,
    };

    return this.prisma.organization.findFirst({
      where: {
        ...(scope.organizationId ? { id: scope.organizationId } : {}),
        isActive: true,
        sessions: { some: sessionWhere },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sessions: {
          where: sessionWhere,
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: {
            sessionCourses: {
              where: sessionCourseWhere,
              orderBy: { sortOrder: 'asc' },
              take: 1,
              include: { course: true },
            },
          },
        },
      },
    });
  }

  findContextOptions(scope: DashboardScope) {
    return Promise.all([
      this.prisma.organization.findMany({
        where: {
          ...(scope.organizationId ? { id: scope.organizationId } : {}),
          isActive: true,
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      }),
      scope.organizationId
        ? this.prisma.session.findMany({
            where: { organizationId: scope.organizationId, isActive: true },
            orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
            select: { id: true, organizationId: true, name: true, code: true },
          })
        : Promise.resolve([]),
      scope.sessionId
        ? this.prisma.sessionCourse.findMany({
            where: { sessionId: scope.sessionId, isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              sessionId: true,
              courseId: true,
              displayName: true,
              course: { select: { id: true, name: true, code: true } },
            },
          })
        : Promise.resolve([]),
      scope.sessionCourseId
        ? this.prisma.folder.findMany({
            where: { sessionCourseId: scope.sessionCourseId, isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            select: { id: true, sessionCourseId: true, parentFolderId: true, name: true },
          })
        : Promise.resolve([]),
    ]).then(([organizations, sessions, sessionCourses, folders]) => ({
      organizations,
      sessions,
      sessionCourses,
      folders,
    }));
  }

  countStatistics(scope: DashboardScope) {
    const organizationWhere: Prisma.OrganizationWhereInput = {
      ...(scope.organizationId ? { id: scope.organizationId } : {}),
    };
    const sessionWhere: Prisma.SessionWhereInput = {
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
      ...(scope.sessionId ? { id: scope.sessionId } : {}),
    };
    const sessionCourseWhere: Prisma.SessionCourseWhereInput = {
      ...(scope.organizationId
        ? { session: { organizationId: scope.organizationId } }
        : {}),
      ...(scope.sessionId ? { sessionId: scope.sessionId } : {}),
      ...(scope.sessionCourseId ? { id: scope.sessionCourseId } : {}),
    };
    const folderSessionCourseWhere: Prisma.SessionCourseWhereInput = {
      ...(scope.organizationId
        ? { session: { organizationId: scope.organizationId } }
        : {}),
      ...(scope.sessionId ? { sessionId: scope.sessionId } : {}),
    };
    const folderWhere: Prisma.FolderWhereInput = {
      ...(Object.keys(folderSessionCourseWhere).length
        ? { sessionCourse: folderSessionCourseWhere }
        : {}),
      ...(scope.sessionCourseId ? { sessionCourseId: scope.sessionCourseId } : {}),
      ...(scope.folderId ? { id: scope.folderId } : {}),
    };
    const resourceWhere: Prisma.ResourceWhereInput = {
      ...(Object.keys(folderWhere).length ? { folder: folderWhere } : {}),
    };
    const courseWhere: Prisma.CourseWhereInput =
      Object.keys(sessionCourseWhere).length
        ? { sessionCourses: { some: sessionCourseWhere } }
        : {};
    const userWhere: Prisma.UserWhereInput = {
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
    };

    return Promise.all([
      this.countMetric('organization', organizationWhere, 'isActive'),
      this.countMetric('session', sessionWhere, 'isActive'),
      this.countMetric('course', courseWhere, 'isActive'),
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
