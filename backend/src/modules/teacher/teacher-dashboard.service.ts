import { ForbiddenException, Injectable } from '@nestjs/common';

import { CurrentUser } from '../auth/types/current-user.types';
import {
  TeacherCoursesQueryDto,
  TeacherResourcesQueryDto,
  TeacherStudentsQueryDto,
} from './dto/teacher-query.dto';
import { TeacherDashboardRepository } from './teacher-dashboard.repository';

@Injectable()
export class TeacherDashboardService {
  constructor(
    private readonly teacherDashboardRepository: TeacherDashboardRepository,
  ) {}

  async getDashboard(user: CurrentUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('Teacher organization context is required');
    }

    const assignments =
      await this.teacherDashboardRepository.findAssignedCourses(
        user.userId,
        user.organizationId,
      );
    const sessionCourseIds = assignments.map(
      (assignment) => assignment.sessionCourseId,
    );

    const [
      distinctStudents,
      courseEnrollments,
      folders,
      resources,
      publishedResources,
      resourcesByType,
      resourceTypes,
      courses,
      recentResources,
      recentStudentRows,
    ] = await Promise.all([
      this.teacherDashboardRepository.countDistinctStudents(
        sessionCourseIds,
        user.organizationId,
      ),
      this.teacherDashboardRepository.countCourseEnrollments(
        sessionCourseIds,
        user.organizationId,
      ),
      this.teacherDashboardRepository.countFolders(sessionCourseIds),
      this.teacherDashboardRepository.countResources(sessionCourseIds),
      this.teacherDashboardRepository.countPublishedResources(sessionCourseIds),
      this.teacherDashboardRepository.countResourcesByType(sessionCourseIds),
      this.teacherDashboardRepository.findResourceTypes(),
      this.teacherDashboardRepository.findCourseSummaries(
        sessionCourseIds,
        user.organizationId,
      ),
      this.teacherDashboardRepository.findRecentResources(sessionCourseIds),
      this.teacherDashboardRepository.findRecentStudents(
        sessionCourseIds,
        user.organizationId,
      ),
    ]);

    const typeCounts = this.toResourceTypeCounts(resourcesByType, resourceTypes);

    return {
      teacher: {
        id: user.userId,
        email: user.email,
        organizationId: user.organizationId,
      },
      statistics: {
        assignedCourses: sessionCourseIds.length,
        activeCourses: courses.filter((course) => course.isActive).length,
        enrolledStudents: distinctStudents,
        courseEnrollments,
        folders,
        resources,
        publishedResources,
        resourceTypes: typeCounts,
      },
      courses: courses.map((course) => this.toCourse(course)),
      recentResources: recentResources.map((resource) =>
        this.toResource(resource),
      ),
      recentStudents: this.toUniqueRecentStudents(recentStudentRows),
    };
  }

  async getCourses(user: CurrentUser, query: TeacherCoursesQueryDto) {
    if (!user.organizationId) {
      throw new ForbiddenException('Teacher organization context is required');
    }

    const normalized = this.normalizeQuery(query);
    const [items, total] = await this.teacherDashboardRepository.findCourseList(
      user.userId,
      user.organizationId,
      { ...normalized, status: query.status },
    );

    return this.toPaginated(
      items.map((course) => this.toCourse(course)),
      total,
      normalized,
    );
  }

  async getResources(user: CurrentUser, query: TeacherResourcesQueryDto) {
    if (!user.organizationId) {
      throw new ForbiddenException('Teacher organization context is required');
    }

    const sessionCourseIds = await this.getAssignedSessionCourseIds(user);
    const normalized = this.normalizeQuery(query);
    const [items, total] =
      await this.teacherDashboardRepository.findResourceList(sessionCourseIds, {
        ...normalized,
        published: query.published,
        resourceTypeId: query.resourceTypeId,
        sessionCourseId: query.sessionCourseId,
        status: query.status,
      });

    return this.toPaginated(
      items.map((resource) => this.toResource(resource)),
      total,
      normalized,
    );
  }

  async getStudents(user: CurrentUser, query: TeacherStudentsQueryDto) {
    if (!user.organizationId) {
      throw new ForbiddenException('Teacher organization context is required');
    }

    const sessionCourseIds = await this.getAssignedSessionCourseIds(user);
    const normalized = this.normalizeQuery(query);
    const [items, total] =
      await this.teacherDashboardRepository.findStudentList(
        sessionCourseIds,
        user.organizationId,
        { ...normalized, sessionCourseId: query.sessionCourseId },
      );

    return this.toPaginated(
      items.map((studentEnrollment) =>
        this.toStudentCourseEnrollment(studentEnrollment),
      ),
      total,
      normalized,
    );
  }

  getResourceTypes() {
    return this.teacherDashboardRepository.findResourceTypes();
  }

  private toCourse(
    course: Awaited<
      ReturnType<TeacherDashboardRepository['findCourseSummaries']>
    >[number],
  ) {
    const resources = course.folders.flatMap((folder) => folder.resources);
    const typeCounts = resources.reduce<Record<string, number>>(
      (counts, resource) => {
        const code = resource.resourceType.code;
        counts[code] = (counts[code] ?? 0) + 1;
        return counts;
      },
      {},
    );

    return {
      sessionCourseId: course.id,
      courseId: course.courseId,
      title: course.displayName ?? course.course.name,
      code: course.course.code,
      description: course.description ?? course.course.description,
      session: {
        id: course.session.id,
        name: course.session.name,
        code: course.session.code,
      },
      status: course.status,
      isPublished: course.isPublished,
      enrolledStudents: course.studentCourseEnrollments.length,
      folders: course.folders.length,
      resources: resources.length,
      publishedResources: resources.filter(
        (resource) => resource.isPublished && resource.status === 'PUBLISHED',
      ).length,
      resourceTypes: typeCounts,
    };
  }

  private toResource(
    resource:
      | Awaited<
          ReturnType<TeacherDashboardRepository['findRecentResources']>
        >[number]
      | Awaited<
          ReturnType<TeacherDashboardRepository['findResourceList']>
        >[0][number],
  ) {
    const sessionCourse = resource.folder.sessionCourse as {
      id: number;
      displayName: string | null;
      course: { code: string; name: string };
      session?: { id: number; name: string; code: string | null };
    };

    return {
      id: resource.id,
      uuid: resource.uuid,
      title: resource.title,
      description: resource.description,
      resourceType: {
        id: resource.resourceType.id,
        code: resource.resourceType.code,
        name: resource.resourceType.name,
      },
      status: resource.status,
      isPublished: resource.isPublished,
      documentUrl: resource.documentUrl,
      videoUrl: resource.videoUrl,
      examId: resource.examId,
      mimeType: resource.mimeType,
      fileSize: resource.fileSize?.toString() ?? null,
      durationInSeconds: resource.durationInSeconds,
      updatedAt: resource.updatedAt,
      createdAt: resource.createdAt,
      folder: {
        id: resource.folder.id,
        name: resource.folder.name,
      },
      sessionCourse: {
        id: sessionCourse.id,
        title: sessionCourse.displayName ?? sessionCourse.course.name,
        courseCode: sessionCourse.course.code,
        session: sessionCourse.session
          ? {
              id: sessionCourse.session.id,
              name: sessionCourse.session.name,
              code: sessionCourse.session.code,
            }
          : undefined,
      },
    };
  }

  private toStudentCourseEnrollment(
    row: Awaited<
      ReturnType<TeacherDashboardRepository['findStudentList']>
    >[0][number],
  ) {
    const student = row.enrollment.student;

    return {
      id: row.id,
      uuid: row.uuid,
      status: row.status,
      isActive: row.isActive,
      enrolledAt: row.createdAt,
      student: {
        id: student.id,
        uuid: student.uuid,
        name: this.studentName(student),
        email: student.user.email,
        phone: student.profile?.phone ?? student.user.phone ?? null,
        studentCode: student.studentCode,
        status: student.status,
        gender: student.profile?.gender ?? null,
      },
      enrollment: {
        id: row.enrollment.id,
        uuid: row.enrollment.uuid,
        status: row.enrollment.status,
      },
      sessionCourse: {
        id: row.sessionCourse.id,
        title: row.sessionCourse.displayName ?? row.sessionCourse.course.name,
        courseCode: row.sessionCourse.course.code,
        session: {
          id: row.sessionCourse.session.id,
          name: row.sessionCourse.session.name,
          code: row.sessionCourse.session.code,
        },
      },
    };
  }

  private toResourceTypeCounts(
    resourcesByType: Awaited<
      ReturnType<TeacherDashboardRepository['countResourcesByType']>
    >,
    resourceTypes: Awaited<
      ReturnType<TeacherDashboardRepository['findResourceTypes']>
    >,
  ) {
    const codesById = new Map(
      resourceTypes.map((resourceType) => [
        resourceType.id,
        resourceType.code,
      ]),
    );

    return resourcesByType.reduce<Record<string, number>>((counts, row) => {
      const code = codesById.get(row.resourceTypeId);
      if (code) counts[code] = row._count._all;
      return counts;
    }, {});
  }

  private toUniqueRecentStudents(
    rows: Awaited<
      ReturnType<TeacherDashboardRepository['findRecentStudents']>
    >,
  ) {
    const seen = new Set<number>();
    const students: Array<{
      id: number;
      uuid: string;
      name: string;
      email: string;
      phone: string | null;
      studentCode: string;
      sessionCourse: { id: number; title: string };
    }> = [];

    for (const row of rows) {
      const student = row.enrollment.student;
      if (seen.has(student.id)) continue;
      seen.add(student.id);
      students.push({
        id: student.id,
        uuid: student.uuid,
        name: this.studentName(student),
        email: student.user.email,
        phone: student.profile?.phone ?? null,
        studentCode: student.studentCode,
        sessionCourse: {
          id: row.sessionCourse.id,
          title: row.sessionCourse.displayName ?? row.sessionCourse.course.name,
        },
      });
    }

    return students;
  }

  private studentName(student: {
    profile?: { firstName: string; lastName: string | null } | null;
    user: { firstName: string; lastName: string | null };
  }) {
    const firstName = student.profile?.firstName ?? student.user.firstName;
    const lastName = student.profile?.lastName ?? student.user.lastName;
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  private normalizeQuery<
    T extends { limit?: number; page?: number; search?: string },
  >(query: T) {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search?.trim() ?? '',
    };
  }

  private toPaginated<T>(
    items: T[],
    total: number,
    query: { page: number; limit: number },
  ) {
    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private async getAssignedSessionCourseIds(user: CurrentUser) {
    if (!user.organizationId) {
      throw new ForbiddenException('Teacher organization context is required');
    }

    const assignments =
      await this.teacherDashboardRepository.findAssignedCourses(
        user.userId,
        user.organizationId,
      );

    return assignments.map((assignment) => assignment.sessionCourseId);
  }
}
