import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  ActivitySessionEndReason,
  AuthenticationAttemptOutcome,
  StudentActivityEventType,
} from '@prisma/client';
import * as XLSX from 'xlsx';

import { CurrentUser } from '../../auth/types/current-user.types';
import { DEFAULT_ACTIVITY_POLICY } from '../constants/activity.constants';
import {
  StudentActivityReportExportQueryDto,
  StudentActivityReportQueryDto,
  REPORT_ACTIVITY_TYPES,
} from '../dto/student-activity-report.dto';
import { ActivityReportRepository } from '../repositories/activity-report.repository';
import {
  ActivityReportFilters,
  ActivityTimelineItem,
} from '../types/activity-report.types';

const EXPORT_ROW_LIMIT = 50_000;

@Injectable()
export class ActivityReportService {
  constructor(
    private readonly activityReportRepository: ActivityReportRepository,
  ) {}

  async getStudentReport(
    currentUser: CurrentUser,
    studentUuid: string,
    query: StudentActivityReportQueryDto,
    auditAccess = true,
  ) {
    const context = await this.resolveContext(currentUser, studentUuid, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const take = page * limit;

    const [
      authenticationAttempts,
      endedUserSessions,
      events,
      authenticationCounts,
      userSessionSummary,
      endedSessionCount,
      resourceSessionSummary,
      resourceBreakdown,
      courseOptions,
      documentPageVisits,
      eventCount,
    ] = await Promise.all([
      this.activityReportRepository.authenticationAttempts(
        context.filters,
        take,
      ),
      this.activityReportRepository.endedUserSessions(context.filters, take),
      this.activityReportRepository.activityEvents(context.filters, take),
      this.activityReportRepository.countAuthenticationAttempts(
        context.filters,
      ),
      this.activityReportRepository.summarizeUserSessions(context.filters),
      this.activityReportRepository.countEndedUserSessions(context.filters),
      this.activityReportRepository.summarizeResourceSessions(context.filters),
      this.activityReportRepository.resourceBreakdown(context.filters),
      this.activityReportRepository.courseOptions(context.filters),
      this.activityReportRepository.countDocumentPageVisits(context.filters),
      this.activityReportRepository.countActivityEvents(context.filters),
    ]);

    const timeline = [
      ...authenticationAttempts.map((attempt) =>
        this.toAuthenticationItem(attempt),
      ),
      ...endedUserSessions.map((session) => this.toSessionEndItem(session)),
      ...events.map((event) => this.toEventItem(event)),
    ].sort(this.timelineSort);
    const offset = (page - 1) * limit;
    const successfulLogins =
      authenticationCounts.find(
        (row) => row.outcome === AuthenticationAttemptOutcome.SUCCESS,
      )?._count._all ?? 0;
    const failedLogins =
      authenticationCounts.find(
        (row) => row.outcome === AuthenticationAttemptOutcome.FAILED,
      )?._count._all ?? 0;
    const total =
      successfulLogins + failedLogins + endedSessionCount + eventCount;

    const report = {
      data: {
        student: this.toStudent(context.student),
        organization: context.student.organization,
        range: {
          from: context.filters.from,
          to: context.filters.to,
          authenticationFrom: context.filters.authenticationFrom,
          retentionDays: context.policy.activityRetentionDays,
          failedLoginRetentionDays: context.policy.failedLoginRetentionDays,
        },
        scope: {
          roleScope: context.roleScope,
          sessionCourseIds: context.filters.allowedSessionCourseIds ?? null,
        },
        durationCalculation: {
          mode: 'ADDITIVE_SESSION_TIME',
          concurrentTabsAndDevicesIncluded: true,
          unit: 'SECONDS',
        },
        summary: {
          successfulLogins,
          failedLogins,
          authenticationSessions: userSessionSummary._count._all,
          endedSessions: endedSessionCount,
          totalElapsedDurationSeconds:
            userSessionSummary._sum.elapsedDurationSeconds ?? 0,
          totalActiveDurationSeconds:
            userSessionSummary._sum.activeDurationSeconds ?? 0,
          totalIdleDurationSeconds:
            userSessionSummary._sum.idleDurationSeconds ?? 0,
          resourceSessions: resourceSessionSummary._count._all,
          resourceActiveDurationSeconds:
            resourceSessionSummary._sum.activeDurationSeconds ?? 0,
          resourceIdleDurationSeconds:
            resourceSessionSummary._sum.idleDurationSeconds ?? 0,
          distinctResources: resourceBreakdown.length,
          documentPageVisits,
          activityLogEntries: total,
        },
        resourceBreakdown: resourceBreakdown
          .map((row) => ({
            resourceId: row.resourceId,
            resourceTitle: row.resourceTitleSnapshot,
            resourceType: row.resourceTypeCodeSnapshot,
            courseName: row.courseNameSnapshot,
            sessionCount: row._count._all,
            activeDurationSeconds: row._sum.activeDurationSeconds ?? 0,
            idleDurationSeconds: row._sum.idleDurationSeconds ?? 0,
            lastActivityAt: row._max.lastHeartbeatAt,
          }))
          .sort(
            (left, right) =>
              right.activeDurationSeconds - left.activeDurationSeconds,
          ),
        filterOptions: {
          courses: courseOptions.map(({ sessionCourse }) => ({
            sessionCourseId: sessionCourse.id,
            name: sessionCourse.displayName ?? sessionCourse.course.name,
            code: sessionCourse.course.code,
            sessionName: sessionCourse.session.name,
          })),
          resourceTypes: [
            ...new Set(
              resourceBreakdown.map((row) => row.resourceTypeCodeSnapshot),
            ),
          ].sort(),
          activityTypes: REPORT_ACTIVITY_TYPES,
        },
        activityLog: timeline.slice(offset, offset + limit),
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    if (auditAccess) {
      await this.recordReportAccess(
        currentUser,
        context.student.id,
        context.filters.organizationId,
        StudentActivityEventType.REPORT_VIEW,
        query,
      );
    }

    return report;
  }

  async exportStudentReport(
    currentUser: CurrentUser,
    studentUuid: string,
    query: StudentActivityReportExportQueryDto,
  ) {
    const format = query.format ?? 'xlsx';
    const context = await this.resolveContext(currentUser, studentUuid, query);
    const report = await this.getStudentReport(
      currentUser,
      studentUuid,
      {
        ...query,
        page: 1,
        limit: 100,
      },
      false,
    );
    const take = EXPORT_ROW_LIMIT + 1;
    const [
      authenticationAttempts,
      endedUserSessions,
      events,
      userSessions,
      resources,
    ] = await Promise.all([
      this.activityReportRepository.authenticationAttempts(
        context.filters,
        take,
      ),
      this.activityReportRepository.endedUserSessions(context.filters, take),
      this.activityReportRepository.activityEvents(context.filters, take),
      this.activityReportRepository.userSessions(context.filters, take),
      this.activityReportRepository.resourceSessions(context.filters, take),
    ]);
    const timeline = [
      ...authenticationAttempts.map((attempt) =>
        this.toAuthenticationItem(attempt),
      ),
      ...endedUserSessions.map((session) => this.toSessionEndItem(session)),
      ...events.map((event) => this.toEventItem(event)),
    ].sort(this.timelineSort);
    const documentPages = resources.flatMap((resource) =>
      resource.documentPages.map((page) => ({ resource, page })),
    );

    if (
      authenticationAttempts.length > EXPORT_ROW_LIMIT ||
      endedUserSessions.length > EXPORT_ROW_LIMIT ||
      events.length > EXPORT_ROW_LIMIT ||
      userSessions.length > EXPORT_ROW_LIMIT ||
      resources.length > EXPORT_ROW_LIMIT ||
      timeline.length > EXPORT_ROW_LIMIT ||
      documentPages.length > EXPORT_ROW_LIMIT
    ) {
      throw new PayloadTooLargeException(
        `The export exceeds ${EXPORT_ROW_LIMIT} rows; narrow the date or activity filters`,
      );
    }

    const safeStudentCode = context.student.studentCode.replace(
      /[^a-zA-Z0-9._-]+/g,
      '-',
    );
    const baseName = `student-activity-${safeStudentCode}-${this.dateStamp(
      context.filters.to,
    )}`;
    const result =
      format === 'csv'
        ? {
            buffer: Buffer.from(this.toCsv(timeline), 'utf8'),
            contentType: 'text/csv; charset=utf-8',
            filename: `${baseName}.csv`,
          }
        : {
            buffer: this.toWorkbook(
              report.data,
              timeline,
              userSessions,
              resources,
            ),
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename: `${baseName}.xlsx`,
          };

    await this.recordReportAccess(
      currentUser,
      context.student.id,
      context.filters.organizationId,
      StudentActivityEventType.REPORT_EXPORT,
      query,
      format,
    );

    return result;
  }

  private async recordReportAccess(
    currentUser: CurrentUser,
    studentId: number,
    organizationId: number,
    eventType:
      | typeof StudentActivityEventType.REPORT_VIEW
      | typeof StudentActivityEventType.REPORT_EXPORT,
    query: StudentActivityReportQueryDto,
    format?: 'csv' | 'xlsx',
  ) {
    const actorSession = currentUser.activitySessionUuid
      ? await this.activityReportRepository.findActorActivitySession(
          currentUser.activitySessionUuid,
          currentUser.userId,
        )
      : null;

    await this.activityReportRepository.createReportAccessEvent({
      organizationId,
      studentId,
      userActivitySessionId: actorSession?.id ?? null,
      eventType,
      metadata: {
        actorUserId: currentUser.userId,
        actorEmail: currentUser.email,
        actorRoles: currentUser.roles ?? [],
        from: query.from ?? null,
        to: query.to ?? null,
        sessionCourseId: query.sessionCourseId ?? null,
        resourceType: query.resourceType ?? null,
        activityTypes: query.activityTypes ?? [],
        format: format ?? null,
      },
    });
  }

  private async resolveContext(
    currentUser: CurrentUser,
    studentUuid: string,
    query: StudentActivityReportQueryDto,
  ) {
    const student =
      await this.activityReportRepository.findStudent(studentUuid);
    if (!student) throw new NotFoundException('Student not found');
    if (!student.organizationId || !student.organization) {
      throw new BadRequestException('Student organization context is missing');
    }

    const roles = new Set(currentUser.roles ?? []);
    const isSuperAdmin = roles.has('SUPER_ADMIN');
    if (
      !isSuperAdmin &&
      currentUser.organizationId !== student.organizationId
    ) {
      throw new ForbiddenException('Student belongs to another organization');
    }

    const hasOrganizationWideAccess =
      isSuperAdmin || roles.has('ADMIN') || roles.has('COUNSELOR');
    let allowedSessionCourseIds: number[] | undefined;
    const roleScope = hasOrganizationWideAccess
      ? isSuperAdmin
        ? 'GLOBAL'
        : 'ORGANIZATION'
      : 'ASSIGNED_COURSES';
    if (!hasOrganizationWideAccess) {
      if (!roles.has('TEACHER')) throw new ForbiddenException('Access denied');
      allowedSessionCourseIds =
        await this.activityReportRepository.findTeacherStudentCourseIds(
          currentUser.userId,
          student.id,
          student.organizationId,
        );
      if (!allowedSessionCourseIds.length) {
        throw new ForbiddenException('Student is not assigned to this teacher');
      }
      if (
        query.sessionCourseId &&
        !allowedSessionCourseIds.includes(query.sessionCourseId)
      ) {
        throw new ForbiddenException('Course is not assigned to this teacher');
      }
    }

    const policy =
      (await this.activityReportRepository.findPolicy(
        student.organizationId,
      )) ?? DEFAULT_ACTIVITY_POLICY;
    const now = new Date();
    const retentionFrom = new Date(
      now.getTime() - policy.activityRetentionDays * 86_400_000,
    );
    const failedLoginRetentionFrom = new Date(
      now.getTime() - policy.failedLoginRetentionDays * 86_400_000,
    );
    const requestedFrom = query.from ? new Date(query.from) : retentionFrom;
    const requestedTo = query.to ? new Date(query.to) : now;
    const to = requestedTo > now ? now : requestedTo;
    const from = requestedFrom < retentionFrom ? retentionFrom : requestedFrom;
    if (from > to) {
      throw new BadRequestException(
        'The requested date range is invalid or outside the retention period',
      );
    }
    const authenticationFrom =
      from < failedLoginRetentionFrom ? failedLoginRetentionFrom : from;

    const filters: ActivityReportFilters = {
      studentId: student.id,
      studentEmail: student.user.email,
      organizationId: student.organizationId,
      from,
      authenticationFrom,
      to,
      allowedSessionCourseIds,
      sessionCourseId: query.sessionCourseId,
      resourceType: query.resourceType,
      activityTypes: query.activityTypes,
    };
    return { student, policy, filters, roleScope };
  }

  private toStudent(
    student: Awaited<ReturnType<ActivityReportRepository['findStudent']>>,
  ) {
    if (!student) throw new NotFoundException('Student not found');
    const firstName = student.profile?.firstName ?? student.user.firstName;
    const lastName = student.profile?.lastName ?? student.user.lastName;
    return {
      uuid: student.uuid,
      studentCode: student.studentCode,
      admissionNumber: student.admissionNumber,
      rollNumber: student.rollNumber,
      name: [firstName, lastName].filter(Boolean).join(' '),
      email: student.user.email,
      phone: student.profile?.phone ?? null,
      status: student.status,
    };
  }

  private toAuthenticationItem(
    attempt: Awaited<
      ReturnType<ActivityReportRepository['authenticationAttempts']>
    >[number],
  ): ActivityTimelineItem {
    const successful = attempt.outcome === AuthenticationAttemptOutcome.SUCCESS;
    return {
      id: `authentication:${attempt.uuid}`,
      occurredAt: attempt.occurredAt,
      activityType: successful ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      category: 'AUTHENTICATION',
      title: successful ? 'Login successful' : 'Login failed',
      courseName: null,
      resourceTitle: null,
      resourceType: null,
      sessionUuid: null,
      resourceSessionUuid: null,
      pageNumber: null,
      videoPositionSeconds: null,
      activeDurationDeltaSeconds: 0,
      outcome: attempt.outcome,
      reason: attempt.failureReason,
      ipAddress: attempt.ipAddress,
      deviceType: attempt.deviceType,
      browser: attempt.browser,
      operatingSystem: attempt.operatingSystem,
      userAgent: attempt.userAgent,
      metadata: null,
    };
  }

  private toSessionEndItem(
    session: Awaited<
      ReturnType<ActivityReportRepository['endedUserSessions']>
    >[number],
  ): ActivityTimelineItem {
    const timedOut =
      session.endReason === ActivitySessionEndReason.IDLE_TIMEOUT;
    return {
      id: `session:${session.uuid}:end`,
      occurredAt: session.endedAt ?? session.lastSeenAt,
      activityType: timedOut ? 'SESSION_TIMEOUT' : 'LOGOUT',
      category: 'SESSION',
      title: timedOut ? 'Session timed out' : 'Logged out',
      courseName: null,
      resourceTitle: null,
      resourceType: null,
      sessionUuid: session.uuid,
      resourceSessionUuid: null,
      pageNumber: null,
      videoPositionSeconds: null,
      activeDurationDeltaSeconds: session.activeDurationSeconds,
      outcome: null,
      reason: session.endReason,
      ipAddress: session.ipAddress,
      deviceType: session.deviceType,
      browser: session.browser,
      operatingSystem: session.operatingSystem,
      userAgent: session.userAgent,
      metadata: {
        elapsedDurationSeconds: session.elapsedDurationSeconds,
        activeDurationSeconds: session.activeDurationSeconds,
        idleDurationSeconds: session.idleDurationSeconds,
      },
    };
  }

  private toEventItem(
    event: Awaited<
      ReturnType<ActivityReportRepository['activityEvents']>
    >[number],
  ): ActivityTimelineItem {
    const authSession = event.userActivitySession;
    return {
      id: `event:${event.uuid}`,
      occurredAt: event.occurredAt,
      activityType: event.eventType,
      category: this.eventCategory(event.eventType),
      title: this.eventTitle(event.eventType),
      courseName: event.courseNameSnapshot,
      resourceTitle: event.resourceTitleSnapshot,
      resourceType: event.resourceTypeCodeSnapshot,
      sessionUuid: authSession?.uuid ?? null,
      resourceSessionUuid: event.resourceActivitySession?.uuid ?? null,
      pageNumber: event.pageNumber,
      videoPositionSeconds: event.videoPositionSeconds,
      activeDurationDeltaSeconds: event.activeDurationDeltaSeconds,
      outcome: null,
      reason: null,
      ipAddress: authSession?.ipAddress ?? null,
      deviceType: authSession?.deviceType ?? null,
      browser: authSession?.browser ?? null,
      operatingSystem: authSession?.operatingSystem ?? null,
      userAgent: authSession?.userAgent ?? null,
      metadata: event.metadata,
    };
  }

  private eventCategory(eventType: StudentActivityEventType) {
    if (eventType.startsWith('DOCUMENT_')) return 'DOCUMENT' as const;
    if (eventType.startsWith('VIDEO_')) return 'VIDEO' as const;
    if (eventType.startsWith('EXAM_')) return 'EXAM' as const;
    if (eventType.startsWith('REPORT_')) return 'REPORT' as const;
    if (eventType.startsWith('RESOURCE_')) return 'RESOURCE' as const;
    return 'SESSION' as const;
  }

  private eventTitle(eventType: StudentActivityEventType) {
    return eventType
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private readonly timelineSort = (
    left: ActivityTimelineItem,
    right: ActivityTimelineItem,
  ) => {
    const time = right.occurredAt.getTime() - left.occurredAt.getTime();
    return time || right.id.localeCompare(left.id);
  };

  private toCsv(timeline: ActivityTimelineItem[]) {
    const headers = [
      'occurred_at',
      'activity_type',
      'category',
      'title',
      'course',
      'resource',
      'resource_type',
      'page',
      'video_position_seconds',
      'active_duration_seconds',
      'outcome',
      'reason',
      'ip_address',
      'device_type',
      'browser',
      'operating_system',
      'user_agent',
      'session_uuid',
      'resource_session_uuid',
      'metadata',
    ];
    const rows = timeline.map((item) => [
      item.occurredAt.toISOString(),
      item.activityType,
      item.category,
      item.title,
      item.courseName,
      item.resourceTitle,
      item.resourceType,
      item.pageNumber,
      item.videoPositionSeconds,
      item.activeDurationDeltaSeconds,
      item.outcome,
      item.reason,
      item.ipAddress,
      item.deviceType,
      item.browser,
      item.operatingSystem,
      item.userAgent,
      item.sessionUuid,
      item.resourceSessionUuid,
      item.metadata ? JSON.stringify(item.metadata) : null,
    ]);
    return `\uFEFF${[headers, ...rows]
      .map((row) => row.map((value) => this.csvCell(value)).join(','))
      .join('\r\n')}\r\n`;
  }

  private csvCell(value: unknown) {
    if (value === null || value === undefined) return '';
    const raw =
      typeof value === 'string'
        ? value
        : typeof value === 'number' ||
            typeof value === 'bigint' ||
            typeof value === 'boolean'
          ? value.toString()
          : (JSON.stringify(value) ?? '');
    const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private toWorkbook(
    report: Awaited<
      ReturnType<ActivityReportService['getStudentReport']>
    >['data'],
    timeline: ActivityTimelineItem[],
    userSessions: Awaited<ReturnType<ActivityReportRepository['userSessions']>>,
    resources: Awaited<
      ReturnType<ActivityReportRepository['resourceSessions']>
    >,
  ) {
    const workbook = XLSX.utils.book_new();
    const summaryRows = [
      { metric: 'Student', value: report.student.name },
      { metric: 'Student Code', value: report.student.studentCode },
      { metric: 'From', value: report.range.from.toISOString() },
      { metric: 'To', value: report.range.to.toISOString() },
      ...Object.entries(report.summary).map(([metric, value]) => ({
        metric,
        value,
      })),
    ];
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summaryRows),
      'Summary',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        timeline.map((item) => ({
          occurred_at: item.occurredAt,
          activity_type: item.activityType,
          category: item.category,
          title: item.title,
          course: item.courseName,
          resource: item.resourceTitle,
          resource_type: item.resourceType,
          page: item.pageNumber,
          video_position_seconds: item.videoPositionSeconds,
          active_duration_seconds: item.activeDurationDeltaSeconds,
          outcome: item.outcome,
          reason: item.reason,
          ip_address: item.ipAddress,
          device_type: item.deviceType,
          browser: item.browser,
          operating_system: item.operatingSystem,
          user_agent: item.userAgent,
          session_uuid: item.sessionUuid,
          resource_session_uuid: item.resourceSessionUuid,
          metadata: item.metadata ? JSON.stringify(item.metadata) : null,
        })),
      ),
      'Activity Log',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        userSessions.map((session) => ({
          session_uuid: session.uuid,
          login_at: session.loginAt,
          last_seen_at: session.lastSeenAt,
          ended_at: session.endedAt,
          end_reason: session.endReason,
          elapsed_duration_seconds: session.elapsedDurationSeconds,
          active_duration_seconds: session.activeDurationSeconds,
          idle_duration_seconds: session.idleDurationSeconds,
          ip_address: session.ipAddress,
          device_type: session.deviceType,
          browser: session.browser,
          operating_system: session.operatingSystem,
          user_agent: session.userAgent,
          source: session.source,
        })),
      ),
      'Login Sessions',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        resources.map((resource) => ({
          resource_session_uuid: resource.uuid,
          resource: resource.resourceTitleSnapshot,
          resource_type: resource.resourceTypeCodeSnapshot,
          course: resource.courseNameSnapshot,
          folder: resource.folderNameSnapshot,
          started_at: resource.startedAt,
          ended_at: resource.endedAt,
          end_reason: resource.endReason,
          active_duration_seconds: resource.activeDurationSeconds,
          idle_duration_seconds: resource.idleDurationSeconds,
          start_position_seconds: resource.startPositionSeconds,
          final_position_seconds: resource.finalPositionSeconds,
          max_position_seconds: resource.maxPositionSeconds,
          last_document_page: resource.lastDocumentPage,
          completed: resource.completed,
          source: resource.source,
        })),
      ),
      'Resource Sessions',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        resources.flatMap((resource) =>
          resource.documentPages.map((page) => ({
            resource_session_uuid: resource.uuid,
            resource: resource.resourceTitleSnapshot,
            course: resource.courseNameSnapshot,
            page_number: page.pageNumber,
            visit_sequence: page.visitSequence,
            entered_at: page.enteredAt,
            exited_at: page.exitedAt,
            active_duration_seconds: page.activeDurationSeconds,
          })),
        ),
      ),
      'Document Pages',
    );
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  private dateStamp(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
