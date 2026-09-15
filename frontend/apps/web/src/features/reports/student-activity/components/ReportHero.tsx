import styles from "../styles/StudentActivityReportPage.module.css";
import { StudentActivityReportData } from "@repo/types";
import {
  Activity,
  CheckCircle2,
  Download,
  FileDown,
  RefreshCw,
} from "lucide-react";
import { formatDuration } from "../utils/activityReportFormatting";

export const ReportHero = ({
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
}) => {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
};
