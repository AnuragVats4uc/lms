import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  MonitorSmartphone,
  MousePointerClick,
  ShieldAlert,
} from "lucide-react";
import type {
  StudentActivityReportData,
  StudentActivityTimelineItem,
  StudentReportActivityCategory,
} from "@repo/types";
import type { DataTableColumn } from "@/components/DataTable";
import { DataTable } from "@/components/DataTable";
import styles from "../../styles/StudentActivityReportPage.module.css";

export const StudentActivityTimeline = ({
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
}) => {
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
      category: "LANDING",
      icon: MousePointerClick,
      label: "Landing",
      tone: "blue",
      value: categoryCounts.get("LANDING") ?? 0,
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
};
