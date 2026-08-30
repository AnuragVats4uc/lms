"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
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
  StudentActivityReportData,
  StudentActivityReportQuery,
  StudentActivityTimelineItem,
  StudentReportActivityCategory,
  StudentReportActivityType,
} from "@repo/types";
import { Spinner, Text } from "@repo/ui";
import { PageContainer } from "@repo/ui/dashboard";
import { useAuthSession } from "@repo/auth";

import {
  DataTable,
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  StudentAccessActivity,
  StudentActivityOverview,
  StudentResourceActivity,
} from "./StudentActivityReportSections";
import styles from "./StudentActivityReportPage.module.css";

type FilterState = {
  activityType: "" | StudentReportActivityType;
  from: string;
  resourceType: string;
  sessionCourseId: string;
  to: string;
};

type ReportTab = "overview" | "timeline" | "resources" | "access";

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
const reportTabs: Array<{
  id: ReportTab;
  label: string;
  icon: typeof Activity;
}> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "access", label: "Access & Devices", icon: MonitorSmartphone },
];

export function StudentActivityReportPage() {
  const { studentId: rawStudentId, studentUuid } = useParams<{
    studentId: string;
    studentUuid: string;
  }>();
  const studentId = Number(rawStudentId);
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const isTeacherWorkspace =
    Boolean(currentUser?.roles.includes("TEACHER")) &&
    !currentUser?.roles.some((role) =>
      ["SUPER_ADMIN", "ADMIN", "COUNSELOR"].includes(role),
    );
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const query = useMemo(
    () => toReportQuery(filters, page, limit),
    [filters, limit, page],
  );
  const reportQuery = useQuery({
    enabled:
      Number.isSafeInteger(studentId) && studentId > 0 && Boolean(studentUuid),
    placeholderData: keepPreviousData,
    queryFn: () =>
      activityReportsApi.findStudentActivity(studentId, studentUuid, query),
    queryKey: ["student-activity-report", studentId, studentUuid, query],
    staleTime: 30_000,
  });
  const report = reportQuery.data?.data;
  const meta = reportQuery.data?.meta;
  const columns = useMemo<DataTableColumn<StudentActivityTimelineItem>[]>(
    () => createActivityColumns(),
    [],
  );

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1) as ReportTab;
      if (reportTabs.some((tab) => tab.id === hash)) setActiveTab(hash);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const selectTab = (tab: ReportTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };
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
        studentId,
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

  return (
    <PageContainer>
      <div className={styles.reportPage}>
        <ReportHero
          exporting={exporting}
          isFetching={reportQuery.isFetching}
          onExport={downloadReport}
          onRefresh={() => void reportQuery.refetch()}
          report={report}
        />

        {exportError ? (
          <div className={styles.exportError}>{exportError}</div>
        ) : null}

        <nav aria-label="Activity report sections" className={styles.tabs}>
          {reportTabs.map(({ id, icon: Icon, label }) => (
            <button
              aria-selected={activeTab === id}
              className={activeTab === id ? styles.activeTab : undefined}
              key={id}
              onClick={() => selectTab(id)}
              role="tab"
              type="button"
            >
              <Icon aria-hidden="true" size={15} />
              {label}
            </button>
          ))}
        </nav>

        <ReportFilters
          draftFilters={draftFilters}
          onApply={applyFilters}
          onChange={setDraftFilters}
          onReset={resetFilters}
          report={report}
        />

        {activeTab === "overview" ? (
          <StudentActivityOverview onSelectTab={selectTab} report={report} />
        ) : null}
        {activeTab === "timeline" ? (
          <TimelineSection
            columns={columns}
            isFetching={reportQuery.isFetching}
            limit={limit}
            meta={meta}
            onLimitChange={setLimit}
            onPageChange={setPage}
            page={page}
            report={report}
          />
        ) : null}
        {activeTab === "resources" ? (
          <StudentResourceActivity report={report} />
        ) : null}
        {activeTab === "access" ? (
          <StudentAccessActivity report={report} />
        ) : null}
      </div>
    </PageContainer>
  );
}

function ReportHero({
  exporting,
  isFetching,
  onExport,
  onRefresh,
  report,
}: {
  exporting: "csv" | "xlsx" | null;
  isFetching: boolean;
  onExport: (format: "csv" | "xlsx") => Promise<void>;
  onRefresh: () => void;
  report: StudentActivityReportData;
}) {
  return (
    <section className={styles.heroGrid}>
      <article className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p>Student-specific report</p>
          <h1>Activity Report</h1>
          <span>
            Authentication, duration, resource, document, video and exam
            activity.
          </span>
          <div className={styles.heroIdentity}>
            <strong>{report.student.name}</strong>
            <em>{report.student.status}</em>
          </div>
          <small>
            {report.student.email} · {report.student.studentCode}
          </small>
        </div>
        <img
          alt=""
          aria-hidden="true"
          src="/activity-report-assets/student-analytics-illustration.png"
        />
      </article>

      <article className={styles.eventCountCard}>
        <Activity aria-hidden="true" size={34} />
        <strong>{report.summary.activityLogEntries.toLocaleString()}</strong>
        <p>Activity entries</p>
      </article>

      <article className={styles.insightsCard}>
        <p>Activity insights</p>
        <h2>
          <CheckCircle2 aria-hidden="true" size={25} />
          {formatDuration(report.summary.totalActiveDurationSeconds)} active
          time
        </h2>
        <div className={styles.insightChips}>
          <span>
            <CheckCircle2 aria-hidden="true" size={14} />
            {report.summary.distinctResources} learning resources
          </span>
          <span>
            <CheckCircle2 aria-hidden="true" size={14} />
            {report.summary.successfulLogins} successful logins
          </span>
        </div>
        <div className={styles.heroActions}>
          <button
            aria-label="Refresh report"
            disabled={isFetching}
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={14} />
          </button>
          <button
            disabled={exporting !== null}
            onClick={() => void onExport("csv")}
            type="button"
          >
            <FileDown aria-hidden="true" size={14} />
            {exporting === "csv" ? "Exporting…" : "CSV"}
          </button>
          <button
            disabled={exporting !== null}
            onClick={() => void onExport("xlsx")}
            type="button"
          >
            <Download aria-hidden="true" size={14} />
            {exporting === "xlsx" ? "Exporting…" : "Excel"}
          </button>
        </div>
      </article>
    </section>
  );
}

function ReportFilters({
  draftFilters,
  onApply,
  onChange,
  onReset,
  report,
}: {
  draftFilters: FilterState;
  onApply: () => void;
  onChange: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  report: StudentActivityReportData;
}) {
  return (
    <form
      className={styles.filters}
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <FilterField label="From">
        <input
          max={draftFilters.to}
          onChange={(event) =>
            onChange((current) => ({ ...current, from: event.target.value }))
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
            onChange((current) => ({ ...current, to: event.target.value }))
          }
          type="date"
          value={draftFilters.to}
        />
      </FilterField>
      <FilterField label="Course">
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              sessionCourseId: event.target.value,
            }))
          }
          value={draftFilters.sessionCourseId}
        >
          <option value="">All courses</option>
          {report.filterOptions.courses.map((course) => (
            <option key={course.sessionCourseId} value={course.sessionCourseId}>
              {course.name} · {course.sessionName}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField label="Resource type">
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              resourceType: event.target.value,
            }))
          }
          value={draftFilters.resourceType}
        >
          <option value="">All resource types</option>
          {["DOCUMENT", "VIDEO", "EXAM", ...report.filterOptions.resourceTypes]
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
            onChange((current) => ({
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
        <button className={styles.resetButton} onClick={onReset} type="button">
          Reset
        </button>
        <button className={styles.applyButton} type="submit">
          Apply filters
        </button>
      </div>
    </form>
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

function TimelineSection({
  columns,
  isFetching,
  limit,
  meta,
  onLimitChange,
  onPageChange,
  page,
  report,
}: {
  columns: DataTableColumn<StudentActivityTimelineItem>[];
  isFetching: boolean;
  limit: number;
  meta: { total: number; totalPages: number } | undefined;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
  page: number;
  report: StudentActivityReportData;
}) {
  const categoryCounts = new Map(
    (report.analytics?.activityCategoryBreakdown ?? []).map((item) => [
      item.category,
      item.count,
    ]),
  );
  const cards: Array<{
    category?: StudentReportActivityCategory;
    icon: typeof Activity;
    label: string;
    tone: string;
    value: number;
  }> = [
    {
      icon: Activity,
      label: "All",
      tone: "blue",
      value: report.summary.activityLogEntries,
    },
    {
      category: "AUTHENTICATION",
      icon: ShieldAlert,
      label: "Authentication",
      tone: "green",
      value: categoryCounts.get("AUTHENTICATION") ?? 0,
    },
    {
      category: "RESOURCE",
      icon: BookOpen,
      label: "Resources",
      tone: "violet",
      value: categoryCounts.get("RESOURCE") ?? 0,
    },
    {
      category: "DOCUMENT",
      icon: FileText,
      label: "Documents",
      tone: "amber",
      value: categoryCounts.get("DOCUMENT") ?? 0,
    },
    {
      category: "VIDEO",
      icon: MonitorSmartphone,
      label: "Video",
      tone: "orange",
      value: categoryCounts.get("VIDEO") ?? 0,
    },
    {
      category: "EXAM",
      icon: BarChart3,
      label: "Exams",
      tone: "red",
      value: categoryCounts.get("EXAM") ?? 0,
    },
  ];
  return (
    <div className={styles.tabContent}>
      <section className={styles.timelineStats}>
        {cards.map(({ icon: Icon, label, tone, value }) => (
          <article key={label}>
            <div className={`${styles.metricIcon} ${styles[tone]}`}>
              <Icon aria-hidden="true" size={18} />
            </div>
            <span>{label}</span>
            <strong>{value.toLocaleString()}</strong>
          </article>
        ))}
      </section>
      <section className={`${styles.panel} ${styles.timelinePanel}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Activity timeline</h2>
            <p>
              Times are shown in your local timezone. Concurrent sessions
              contribute additively to total duration.
            </p>
          </div>
          {isFetching ? (
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
          loading={isFetching}
          onPageChange={onPageChange}
          onPageSizeChange={(nextLimit) => {
            onLimitChange(nextLimit);
            onPageChange(1);
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
    </div>
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
      width: 270,
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
      width: 230,
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

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
