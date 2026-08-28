"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Clock3,
  Download,
  FileDown,
  FileText,
  LogIn,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { activityReportsApi } from "@repo/api";
import type {
  StudentActivityReportQuery,
  StudentActivityTimelineItem,
  StudentReportActivityType,
} from "@repo/types";
import { Button, Spinner, Text } from "@repo/ui";
import { PageContainer } from "@repo/ui/dashboard";
import { useAuthSession } from "@repo/auth";

import {
  DataTable,
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import styles from "./StudentActivityReportPage.module.css";

type FilterState = {
  activityType: "" | StudentReportActivityType;
  from: string;
  resourceType: string;
  sessionCourseId: string;
  to: string;
};

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 29 * 86_400_000)
  .toISOString()
  .slice(0, 10);
const initialFilters: FilterState = {
  activityType: "",
  from: thirtyDaysAgo,
  resourceType: "",
  sessionCourseId: "",
  to: today,
};

export function StudentActivityReportPage() {
  const { studentUuid } = useParams<{ studentUuid: string }>();
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const isTeacherWorkspace =
    Boolean(currentUser?.roles.includes("TEACHER")) &&
    !currentUser?.roles.some((role) =>
      ["SUPER_ADMIN", "ADMIN", "COUNSELOR"].includes(role),
    );
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const query = useMemo(
    () => toReportQuery(filters, page, limit),
    [filters, limit, page],
  );
  const reportQuery = useQuery({
    enabled: Boolean(studentUuid),
    placeholderData: keepPreviousData,
    queryFn: () => activityReportsApi.findStudentActivity(studentUuid, query),
    queryKey: ["student-activity-report", studentUuid, query],
    staleTime: 30_000,
  });
  const report = reportQuery.data?.data;
  const meta = reportQuery.data?.meta;
  const columns = useMemo<DataTableColumn<StudentActivityTimelineItem>[]>(
    () => createActivityColumns(),
    [],
  );

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };
  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };
  const downloadReport = async (format: "csv" | "xlsx") => {
    setExportError(null);
    setExporting(format);
    try {
      const blob = await activityReportsApi.exportStudentActivity(
        studentUuid,
        format,
        toReportQuery(filters),
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `student-activity-${report?.student.studentCode ?? studentUuid}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "The report could not be exported.",
      );
    } finally {
      setExporting(null);
    }
  };

  if (reportQuery.isLoading) {
    return (
      <PageContainer>
        <div className={styles.loadingState}>
          <Spinner size="large" />
          <Text color="#52627A">Loading student activity report…</Text>
        </div>
      </PageContainer>
    );
  }

  if (reportQuery.isError || !report) {
    return (
      <PageContainer>
        <div className={styles.errorState}>
          <ShieldAlert aria-hidden="true" size={28} />
          <h1>Unable to load activity report</h1>
          <p>
            {reportQuery.error instanceof Error
              ? reportQuery.error.message
              : "The report is unavailable or you do not have access to this student."}
          </p>
          <div className={styles.errorActions}>
            <button onClick={() => router.back()} type="button">
              Go back
            </button>
            <button onClick={() => void reportQuery.refetch()} type="button">
              Try again
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const summaryCards = [
    {
      icon: LogIn,
      label: "Successful logins",
      value: report.summary.successfulLogins.toLocaleString(),
      tone: "green",
    },
    {
      icon: ShieldAlert,
      label: "Failed logins",
      value: report.summary.failedLogins.toLocaleString(),
      tone: report.summary.failedLogins ? "red" : "slate",
    },
    {
      icon: Clock3,
      label: "Active time",
      value: formatDuration(report.summary.totalActiveDurationSeconds),
      tone: "blue",
    },
    {
      icon: Clock3,
      label: "Idle time",
      value: formatDuration(report.summary.totalIdleDurationSeconds),
      tone: "amber",
    },
    {
      icon: Activity,
      label: "Resource time",
      value: formatDuration(report.summary.resourceActiveDurationSeconds),
      tone: "violet",
    },
    {
      icon: BookOpen,
      label: "Resources opened",
      value: report.summary.distinctResources.toLocaleString(),
      tone: "cyan",
    },
    {
      icon: FileText,
      label: "Page visits",
      value: report.summary.documentPageVisits.toLocaleString(),
      tone: "pink",
    },
    {
      icon: MonitorSmartphone,
      label: "Activity entries",
      value: report.summary.activityLogEntries.toLocaleString(),
      tone: "slate",
    },
  ];

  return (
    <PageContainer>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <button
            aria-label="Back to students"
            className={styles.backButton}
            onClick={() =>
              router.push(
                isTeacherWorkspace ? "/teacher/students" : "/admin/students",
              )
            }
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </button>
          <div>
            <div className={styles.eyebrow}>Student-specific report</div>
            <h1>Activity report</h1>
            <p>
              Authentication, duration, resource, document, video and exam
              activity.
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button
            aria-label="Refresh report"
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            disabled={reportQuery.isFetching}
            onPress={() => void reportQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" size={16} />
            <Button.Text>Refresh</Button.Text>
          </Button>
          <Button
            aria-label="Export CSV"
            background="#FFFFFF"
            borderColor="#BFD4CA"
            borderWidth={1}
            disabled={exporting !== null}
            onPress={() => void downloadReport("csv")}
          >
            <FileDown aria-hidden="true" size={16} />
            <Button.Text>
              {exporting === "csv" ? "Exporting…" : "CSV"}
            </Button.Text>
          </Button>
          <Button
            aria-label="Export XLSX"
            background="#047857"
            borderColor="#047857"
            borderWidth={1}
            disabled={exporting !== null}
            onPress={() => void downloadReport("xlsx")}
          >
            <Download aria-hidden="true" color="#FFFFFF" size={16} />
            <Button.Text color="#FFFFFF">
              {exporting === "xlsx" ? "Exporting…" : "Excel"}
            </Button.Text>
          </Button>
        </div>
      </header>

      {exportError ? (
        <div className={styles.exportError}>{exportError}</div>
      ) : null}

      <section className={styles.studentCard}>
        <div className={styles.avatar}>{initials(report.student.name)}</div>
        <div className={styles.studentIdentity}>
          <div className={styles.studentTitleRow}>
            <h2>{report.student.name}</h2>
            <span className={styles.statusBadge}>{report.student.status}</span>
          </div>
          <p>{report.student.email}</p>
          <div className={styles.studentMeta}>
            <span>{report.student.studentCode}</span>
            <span>{report.organization.name}</span>
            {report.student.rollNumber ? (
              <span>Roll {report.student.rollNumber}</span>
            ) : null}
            <span>
              {report.scope.roleScope === "ASSIGNED_COURSES"
                ? "Assigned courses only"
                : "Organization activity"}
            </span>
          </div>
        </div>
        <div className={styles.retentionNote}>
          <strong>{report.range.retentionDays} days</strong>
          <span>Activity retention</span>
          <small>
            Failed logins: {report.range.failedLoginRetentionDays} days
          </small>
        </div>
      </section>

      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <FilterField label="From">
          <input
            max={draftFilters.to}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                from: event.target.value,
              }))
            }
            type="date"
            value={draftFilters.from}
          />
        </FilterField>
        <FilterField label="To">
          <input
            max={today}
            min={draftFilters.from}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                to: event.target.value,
              }))
            }
            type="date"
            value={draftFilters.to}
          />
        </FilterField>
        <FilterField label="Course">
          <select
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                sessionCourseId: event.target.value,
              }))
            }
            value={draftFilters.sessionCourseId}
          >
            <option value="">All courses</option>
            {report.filterOptions.courses.map((course) => (
              <option
                key={course.sessionCourseId}
                value={course.sessionCourseId}
              >
                {course.name} · {course.sessionName}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Resource type">
          <select
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                resourceType: event.target.value,
              }))
            }
            value={draftFilters.resourceType}
          >
            <option value="">All resource types</option>
            {[
              "DOCUMENT",
              "VIDEO",
              "EXAM",
              ...report.filterOptions.resourceTypes,
            ]
              .filter((value, index, values) => values.indexOf(value) === index)
              .map((resourceType) => (
                <option key={resourceType} value={resourceType}>
                  {formatLabel(resourceType)}
                </option>
              ))}
          </select>
        </FilterField>
        <FilterField label="Activity type">
          <select
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                activityType: event.target.value as
                  "" | StudentReportActivityType,
              }))
            }
            value={draftFilters.activityType}
          >
            <option value="">All activity</option>
            {report.filterOptions.activityTypes.map((activityType) => (
              <option key={activityType} value={activityType}>
                {formatLabel(activityType)}
              </option>
            ))}
          </select>
        </FilterField>
        <div className={styles.filterActions}>
          <button
            className={styles.resetButton}
            onClick={resetFilters}
            type="button"
          >
            Reset
          </button>
          <button className={styles.applyButton} type="submit">
            Apply filters
          </button>
        </div>
      </form>

      <section aria-label="Activity summary" className={styles.summaryGrid}>
        {summaryCards.map(({ icon: Icon, label, tone, value }) => (
          <article className={styles.summaryCard} key={label}>
            <div className={`${styles.summaryIcon} ${styles[tone]}`}>
              <Icon aria-hidden="true" size={19} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Activity timeline</h2>
            <p>
              Times are shown in your local timezone. Concurrent sessions
              contribute additively to total duration.
            </p>
          </div>
          {reportQuery.isFetching ? (
            <span className={styles.syncing}>Updating…</span>
          ) : null}
        </div>
        <DataTable<StudentActivityTimelineItem>
          columns={columns}
          data={report.activityLog}
          emptyState={{
            description:
              "Try widening the date range or clearing activity filters.",
            icon: <Activity aria-hidden="true" size={28} />,
            title: "No activity in this range",
          }}
          getRowId={(item) => item.id}
          loading={reportQuery.isFetching && !reportQuery.isPlaceholderData}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          pagination={{
            entityLabel: "activity entries",
            mode: "server",
            page,
            pageSize: limit,
            pageSizeOptions: [10, 25, 50, 100],
            total: meta?.total ?? 0,
            totalPages: meta?.totalPages ?? 0,
          }}
          renderToolbar={() => null}
          responsiveMode="scroll"
          searchable={false}
          stickyFirstColumn
          stickyHeader
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Resource activity</h2>
            <p>Time spent and visit counts grouped by learning resource.</p>
          </div>
        </div>
        {report.resourceBreakdown.length ? (
          <div className={styles.resourceTableWrap}>
            <table className={styles.resourceTable}>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Course</th>
                  <th>Visits</th>
                  <th>Active time</th>
                  <th>Idle time</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {report.resourceBreakdown.map((resource, index) => (
                  <tr
                    key={`${resource.resourceId ?? resource.resourceTitle}-${index}`}
                  >
                    <td>
                      <strong>{resource.resourceTitle}</strong>
                      <span>{formatLabel(resource.resourceType)}</span>
                    </td>
                    <td>{resource.courseName ?? "—"}</td>
                    <td>{resource.sessionCount}</td>
                    <td>{formatDuration(resource.activeDurationSeconds)}</td>
                    <td>{formatDuration(resource.idleDurationSeconds)}</td>
                    <td>
                      {resource.lastActivityAt
                        ? formatDateTime(resource.lastActivityAt)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyResources}>
            No resource activity in this range.
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className={styles.filterField}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function createActivityColumns(): DataTableColumn<StudentActivityTimelineItem>[] {
  return [
    {
      cell: ({ row }) => (
        <DataTableDateCell
          options={{ dateStyle: "medium", timeStyle: "short" }}
          value={row.occurredAt}
        />
      ),
      header: "Date & time",
      id: "occurredAt",
      sticky: true,
      width: 180,
    },
    {
      cell: ({ row }) => (
        <div className={styles.activityCell}>
          <span
            className={`${styles.categoryBadge} ${styles[row.category.toLowerCase()]}`}
          >
            {row.category}
          </span>
          <strong>{row.title}</strong>
          {row.reason ? <small>{formatLabel(row.reason)}</small> : null}
        </div>
      ),
      header: "Activity",
      id: "activity",
      width: 220,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.resourceTitle ?? row.courseName ?? "Student session"}
          secondary={[
            row.courseName && row.resourceTitle ? row.courseName : null,
            row.pageNumber ? `Page ${row.pageNumber}` : null,
            row.videoPositionSeconds != null
              ? `Position ${formatDuration(row.videoPositionSeconds)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      ),
      header: "Context",
      id: "context",
      width: 260,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={
            row.activeDurationDeltaSeconds
              ? formatDuration(row.activeDurationDeltaSeconds)
              : "—"
          }
          secondary="Active duration"
        />
      ),
      header: "Duration",
      id: "duration",
      width: 140,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={
            [row.deviceType, row.browser]
              .filter((value): value is string => Boolean(value))
              .map(formatLabel)
              .join(" · ") || "Unknown device"
          }
          secondary={row.operatingSystem ?? row.userAgent ?? "—"}
        />
      ),
      header: "Device",
      id: "device",
      width: 220,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.ipAddress ?? "—"}
          secondary={row.outcome ?? ""}
        />
      ),
      header: "IP address",
      id: "ipAddress",
      width: 160,
    },
  ];
}

function toReportQuery(
  filters: FilterState,
  page?: number,
  limit?: number,
): StudentActivityReportQuery {
  return {
    from: filters.from
      ? new Date(`${filters.from}T00:00:00.000`).toISOString()
      : undefined,
    to: filters.to
      ? new Date(`${filters.to}T23:59:59.999`).toISOString()
      : undefined,
    sessionCourseId: filters.sessionCourseId
      ? Number(filters.sessionCourseId)
      : undefined,
    resourceType: filters.resourceType || undefined,
    activityTypes: filters.activityType ? [filters.activityType] : undefined,
    page,
    limit,
  };
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
