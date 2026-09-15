"use client";

import { useState } from "react";
import { BookOpen, Clock3, LogIn } from "lucide-react";
import type { StudentActivityReportData } from "@repo/types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import { resourceColors } from "../../constants";
import { engagementPercent } from "../../utils/engagementPercent";
import {
  formatDuration,
  formatLabel,
} from "../../utils/activityReportFormatting";
import { resourceIcon, resourceKey } from "../../utils/resourcePresentation";
import { DonutBreakdown } from "../../components/charts/DonutBreakdown";
import { ReportPanelTitle as PanelTitle } from "../../components/ReportPanelTitle";
import { ResourceTableRows } from "../../components/tables/ResourceTableRows";
import { ResourceEngagementOverview } from "./ResourceEngagementOverview";

export const StudentResourceActivity = ({
  report,
}: {
  report: StudentActivityReportData;
}) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const totalVisits = report.resourceBreakdown.reduce(
    (total, resource) => total + resource.sessionCount,
    0,
  );
  const typeSegments = (report.analytics?.resourceTypeBreakdown ?? []).map(
    (item) => ({
      color: resourceColors[item.resourceType] ?? "#64748b",
      label: formatLabel(item.resourceType),
      value: item.resourceCount,
    }),
  );
  const metrics = [
    {
      icon: BookOpen,
      label: "Resources",
      tone: "green",
      value: report.summary.distinctResources.toLocaleString(),
    },
    {
      icon: LogIn,
      label: "Visits",
      tone: "violet",
      value: totalVisits.toLocaleString(),
    },
    {
      icon: Clock3,
      label: "Active",
      tone: "blue",
      value: formatDuration(report.summary.resourceActiveDurationSeconds),
    },
    {
      icon: Clock3,
      label: "Idle",
      tone: "amber",
      value: formatDuration(report.summary.resourceIdleDurationSeconds),
    },
  ];
  return (
    <div className={styles.tabContent}>
      <section className={styles.resourceMetrics}>
        {metrics.map(({ icon: Icon, label, tone, value }) => (
          <article key={label}>
            <div className={`${styles.metricIcon} ${styles[tone]}`}>
              <Icon aria-hidden="true" size={20} />
            </div>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </article>
        ))}
      </section>
      <section className={styles.resourceAnalysisGrid}>
        <ResourceEngagementOverview resources={report.resourceBreakdown} />
        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            detail="Distinct resources grouped by learning format."
            title="Resource type mix"
          />
          <DonutBreakdown centerLabel="types" segments={typeSegments} />
        </article>
      </section>
      <section className={`${styles.panel} ${styles.resourceListPanel}`}>
        <PanelTitle
          detail="Select a row to inspect its engagement calculation."
          title="All resource activity"
        />
        {report.resourceBreakdown.length ? (
          <div className={styles.resourceTableWrap}>
            <table className={styles.resourceTable}>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Course</th>
                  <th>Visits</th>
                  <th>Active time</th>
                  <th>Idle time</th>
                  <th>Engagement</th>
                  <th>Last activity</th>
                  <th aria-label="Details" />
                </tr>
              </thead>
              <tbody>
                {report.resourceBreakdown.map((resource, index) => {
                  const key = resourceKey(resource, index);
                  const engagement = engagementPercent(resource);
                  const ResourceIcon = resourceIcon(resource.resourceType);
                  return (
                    <ResourceTableRows
                      expanded={expandedKey === key}
                      key={key}
                      onToggle={() =>
                        setExpandedKey((current) =>
                          current === key ? null : key,
                        )
                      }
                      resource={resource}
                      resourceIcon={ResourceIcon}
                      engagement={engagement}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyResources}>
            <span className={styles.emptyResourceIcon}>
              <BookOpen aria-hidden="true" size={20} />
            </span>
            <div>
              <strong>No tracked resource sessions</strong>
              <span>
                This exact student account has not opened a document or started
                video playback in the selected range. Course progress alone does
                not create an activity session.
              </span>
            </div>
          </div>
        )}
        <div className={styles.resourceFooter}>
          <span>
            Showing 1–{report.resourceBreakdown.length} of{" "}
            {report.resourceBreakdown.length} resources
          </span>
          <div>
            <button disabled type="button">
              Previous
            </button>
            <button className={styles.currentPage} type="button">
              1
            </button>
            <button disabled type="button">
              Next
            </button>
          </div>
          <span>Rows per page&nbsp; 10</span>
        </div>
      </section>
    </div>
  );
};
