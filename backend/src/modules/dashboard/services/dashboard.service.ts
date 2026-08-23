import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/types/current-user.types';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import {
  DashboardRepository,
  DashboardScope,
} from '../repositories/dashboard.repository';

type DashboardFolderRecord = Awaited<
  ReturnType<DashboardRepository['findFolders']>
>[number];

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getSummary(user: CurrentUser, query: DashboardQueryDto) {
    const scope = this.buildScope(user, query);
    const [context, metrics, roles] = await Promise.all([
      this.dashboardRepository.findContext(scope),
      this.dashboardRepository.countStatistics(scope),
      this.dashboardRepository.findRoles(scope),
    ]);

    if (this.hasRequestedContext(query) && !context) {
      throw new NotFoundException('Dashboard context not found');
    }

    const selectedSession = context?.sessions[0];
    const selectedSessionCourse = selectedSession?.sessionCourses[0];
    const folderRecords = selectedSessionCourse
      ? await this.dashboardRepository.findFolders(selectedSessionCourse.id)
      : [];
    const selectedFolder = query.folderId
      ? (folderRecords.find((folder) => folder.id === query.folderId) ?? null)
      : null;
    const tree =
      context && selectedSession && selectedSessionCourse
        ? [
            this.buildContextTree(
              context,
              selectedSession,
              selectedSessionCourse,
              folderRecords,
            ),
          ]
        : [];

    return {
      statistics: {
        organizations: metrics.organizations,
        sessions: metrics.sessions,
        courses: metrics.courses,
        sessionCourses: metrics.sessionCourses,
        folders: metrics.folders,
        resources: metrics.resources,
        users: metrics.users,
        roles: metrics.roles,
        permissions: metrics.permissions,
      },
      context: {
        organization: context
          ? { id: context.id, name: context.name, code: context.code }
          : null,
        session: selectedSession
          ? { id: selectedSession.id, name: selectedSession.name }
          : null,
        course: selectedSessionCourse?.course
          ? {
              id: selectedSessionCourse.course.id,
              name: selectedSessionCourse.course.name,
              code: selectedSessionCourse.course.code,
            }
          : null,
        sessionCourseId: selectedSessionCourse?.id ?? null,
        folder: selectedFolder
          ? {
              id: selectedFolder.id,
              name: selectedFolder.name,
              parentFolderId: selectedFolder.parentFolderId,
            }
          : null,
      },
      folders: folderRecords
        .filter((folder) => folder.parentFolderId === null)
        .map((folder) => this.toFolderResponse(folder, folderRecords)),
      tree,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description,
        permissionCount: role._count.permissions,
        userCount: role._count.userRoles,
        isActive: role.isActive,
      })),
    };
  }

  async getContextOptions(user: CurrentUser, query: DashboardQueryDto) {
    const scope = this.buildScope(user, query);
    return this.dashboardRepository.findContextOptions(scope);
  }

  private buildScope(
    user: CurrentUser,
    query: DashboardQueryDto,
  ): DashboardScope {
    if (
      user.organizationId &&
      query.organizationId &&
      user.organizationId !== query.organizationId
    ) {
      throw new ForbiddenException('You cannot access another organization');
    }

    return {
      organizationId: user.organizationId ?? query.organizationId,
      sessionId: query.sessionId,
      sessionCourseId: query.sessionCourseId,
      folderId: query.folderId,
    };
  }

  private hasRequestedContext(query: DashboardQueryDto) {
    return Boolean(
      query.organizationId ||
      query.sessionId ||
      query.sessionCourseId ||
      query.folderId,
    );
  }

  private toFolderResponse(
    folder: DashboardFolderRecord,
    allFolders: DashboardFolderRecord[],
  ) {
    const descendants = this.getDescendants(folder.id, allFolders);

    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      resourceCount:
        folder._count.resources +
        descendants.reduce((total, child) => total + child._count.resources, 0),
      folderCount: descendants.length,
      updatedAt: folder.updatedAt,
    };
  }

  private getDescendants(id: number, folders: DashboardFolderRecord[]) {
    const descendants: DashboardFolderRecord[] = [];
    const queue = folders.filter((folder) => folder.parentFolderId === id);

    while (queue.length) {
      const folder = queue.shift()!;
      descendants.push(folder);
      queue.push(
        ...folders.filter((child) => child.parentFolderId === folder.id),
      );
    }

    return descendants;
  }

  private buildContextTree(
    organization: NonNullable<
      Awaited<ReturnType<DashboardRepository['findContext']>>
    >,
    session: NonNullable<
      Awaited<ReturnType<DashboardRepository['findContext']>>
    >['sessions'][number],
    sessionCourse: NonNullable<
      NonNullable<
        Awaited<ReturnType<DashboardRepository['findContext']>>
      >['sessions'][number]['sessionCourses'][number]
    >,
    folders: DashboardFolderRecord[],
  ) {
    const folderNodes = new Map<
      number,
      { id: string; type: string; label: string; children: unknown[] }
    >();

    for (const folder of folders) {
      folderNodes.set(folder.id, {
        id: `folder-${folder.id}`,
        type: 'folder',
        label: folder.name,
        children: [],
      });
    }

    const rootFolders: Array<{
      id: string;
      type: string;
      label: string;
      children: unknown[];
    }> = [];
    for (const folder of folders) {
      const node = folderNodes.get(folder.id)!;
      if (folder.parentFolderId === null) {
        rootFolders.push(node);
      } else {
        folderNodes.get(folder.parentFolderId)?.children.push(node);
      }
    }

    return {
      id: `organization-${organization.id}`,
      type: 'organization',
      label: organization.name,
      children: [
        {
          id: `session-${session.id}`,
          type: 'session',
          label: session.name,
          children: [
            {
              id: `session-course-${sessionCourse.id}`,
              type: 'course',
              label: sessionCourse.displayName ?? sessionCourse.course.name,
              children: rootFolders,
            },
          ],
        },
      ],
    };
  }
}
