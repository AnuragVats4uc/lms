"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Laptop,
  LogIn,
  MonitorSmartphone,
  ShieldAlert,
  Smartphone,
  Tablet,
  Video,
} from "lucide-react";
import type {
  StudentActivityDeviceBreakdown,
  StudentActivityReportData,
  StudentActivityResourceBreakdown,
  StudentReportActivityCategory,
} from "@repo/types";

import styles from "./StudentActivityReportPage.module.css";

const categoryColors: Record<StudentReportActivityCategory, string> = {
  AUTHENTICATION: "#059669",
  RESOURCE: "#2563eb",
  DOCUMENT: "#7c3aed",
  VIDEO: "#f97316",
  EXAM: "#e11d48",
  REPORT: "#d97706",
  SESSION: "#94a3b8",
};
const deviceColors = ["#059669", "#2563eb", "#8b5cf6", "#f59e0b"];
const resourceColors: Record<string, string> = {
  VIDEO: "#059669",
  DOCUMENT: "#8b5cf6",
  EXAM: "#f97316",
};

export function StudentActivityOverview({
  onSelectTab,
  report,
}: {
  onSelectTab: (tab: "timeline" | "resources" | "access") => void;
  report: StudentActivityReportData;
}) {
  const authenticationTotal =
    report.summary.successfulLogins + report.summary.failedLogins;
  const loginSuccess = authenticationTotal
    ? Math.round((report.summary.successfulLogins / authenticationTotal) * 100)
    : 0;
  const activityCategories = report.analytics?.activityCategoryBreakdown ?? [];
  const categorySegments = activityCategories.map((item) => ({
    color: categoryColors[item.category],
    label: formatLabel(item.category),
    value: item.count,
  }));
  const devices = aggregateDevices(report.analytics?.deviceBreakdown ?? []);
  const deviceSegments = devices.map((item, index) => ({
    color: deviceColors[index % deviceColors.length],
    label: formatLabel(item.deviceType),
    value: item.sessionCount,
  }));
  const summaryCards = [
    {
      caption: "Total active duration",
      icon: Clock3,
      label: "Active time",
      tone: "blue",
      value: formatDuration(report.summary.totalActiveDurationSeconds),
    },
    {
      caption: "Time on learning resources",
      icon: Activity,
      label: "Resource time",
      tone: "violet",
      value: formatDuration(report.summary.resourceActiveDurationSeconds),
    },
    {
      caption: `${report.summary.successfulLogins} successful · ${report.summary.failedLogins} failed`,
      icon: ShieldAlert,
      label: "Login success",
      tone: "green",
      value: `${loginSuccess}%`,
    },
    {
      caption: "Total recorded events",
      icon: BarChart3,
      label: "Activity events",
      tone: "amber",
      value: report.summary.activityLogEntries.toLocaleString(),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <section aria-label="Activity summary" className={styles.summaryGrid}>
        {summaryCards.map(({ caption, icon: Icon, label, tone, value }) => (
          <article className={styles.summaryCard} key={label}>
            <div className={`${styles.metricIcon} ${styles[tone]}`}>
              <Icon aria-hidden="true" size={20} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{caption}</small>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.analyticsGrid}>
        <article className={`${styles.panel} ${styles.trendPanel}`}>
          <PanelTitle
            detail="Learning-resource active and idle time by session start date."
            title="Activity over time"
          >
            <ChartLegend
              items={[
                { color: "#14b8a6", label: "Active time" },
                { color: "#f59e0b", label: "Idle time" },
              ]}
            />
          </PanelTitle>
          <ActivityTrendChart points={report.analytics?.dailyTrend ?? []} />
        </article>

        <article className={`${styles.panel} ${styles.mixPanel}`}>
          <PanelTitle
            detail="Distribution across all report activity categories."
            title="Activity mix"
          />
          <DonutBreakdown centerLabel="events" segments={categorySegments} />
        </article>
      </section>

      <section className={styles.overviewBottomGrid}>
        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            action={
              <button onClick={() => onSelectTab("resources")} type="button">
                View all resources <ArrowRight aria-hidden="true" size={14} />
              </button>
            }
            detail="Active and idle time grouped by resource."
            title="Resource engagement"
          />
          <ResourceEngagementRows
            resources={report.resourceBreakdown.slice(0, 3)}
          />
        </article>

        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            action={
              <button onClick={() => onSelectTab("access")} type="button">
                View access details <ArrowRight aria-hidden="true" size={14} />
              </button>
            }
            detail="Sessions grouped by device and browser."
            title="Access & devices"
          />
          <DeviceOverview
            devices={devices}
            rawDevices={report.analytics?.deviceBreakdown ?? []}
            segments={deviceSegments}
          />
        </article>

        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            action={
              <button onClick={() => onSelectTab("timeline")} type="button">
                View full timeline <ArrowRight aria-hidden="true" size={14} />
              </button>
            }
            detail="Most recently recorded student actions."
            title="Recent activity"
          />
          <div className={styles.recentActivity}>
            {report.activityLog.slice(0, 3).map((item) => (
              <article key={item.id}>
                <span
                  className={`${styles.timelineDot} ${styles[item.category.toLowerCase()]}`}
                />
                <div>
                  <span
                    className={`${styles.categoryBadge} ${styles[item.category.toLowerCase()]}`}
                  >
                    {item.category}
                  </span>
                  <strong>{item.title}</strong>
                  <small>
                    {formatDateTime(item.occurredAt)} ·{" "}
                    {item.resourceTitle ?? "Student session"}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export function StudentResourceActivity({
  report,
}: {
  report: StudentActivityReportData;
}) {
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
        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            detail="Compare active and idle learning time by resource."
            title="Resource engagement"
          />
          <ResourceEngagementRows resources={report.resourceBreakdown} />
        </article>
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
                This exact student account has not opened a document or
                started video playback in the selected range. Course progress
                alone does not create an activity session.
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
}

export function StudentAccessActivity({
  report,
}: {
  report: StudentActivityReportData;
}) {
  const devices = aggregateDevices(report.analytics?.deviceBreakdown ?? []);
  const rawDevices = report.analytics?.deviceBreakdown ?? [];
  const authenticationTotal =
    report.summary.successfulLogins + report.summary.failedLogins;
  const loginSegments = [
    {
      color: "#059669",
      label: "Successful",
      value: report.summary.successfulLogins,
    },
    { color: "#ef4444", label: "Failed", value: report.summary.failedLogins },
  ];
  const totalSessions = devices.reduce(
    (sum, item) => sum + item.sessionCount,
    0,
  );
  return (
    <div className={styles.tabContent}>
      <section className={styles.resourceMetrics}>
        {[
          {
            icon: LogIn,
            label: "Authentication attempts",
            tone: "blue",
            value: authenticationTotal,
          },
          {
            icon: CheckCircle2,
            label: "Successful logins",
            tone: "green",
            value: report.summary.successfulLogins,
          },
          {
            icon: ShieldAlert,
            label: "Failed logins",
            tone: "red",
            value: report.summary.failedLogins,
          },
          {
            icon: MonitorSmartphone,
            label: "Device types",
            tone: "violet",
            value: devices.length,
          },
        ].map(({ icon: Icon, label, tone, value }) => (
          <article key={label}>
            <div className={`${styles.metricIcon} ${styles[tone]}`}>
              <Icon aria-hidden="true" size={20} />
            </div>
            <div>
              <strong>{value.toLocaleString()}</strong>
              <span>{label}</span>
            </div>
          </article>
        ))}
      </section>
      <section className={styles.accessGrid}>
        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            detail={`Failed-login records are retained for ${report.range.failedLoginRetentionDays} days.`}
            title="Login outcomes"
          />
          <DonutBreakdown centerLabel="attempts" segments={loginSegments} />
        </article>
        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            detail="Active and idle session duration grouped by device."
            title="Device usage"
          />
          <DeviceOverview
            devices={devices}
            rawDevices={rawDevices}
            segments={devices.map((item, index) => ({
              color: deviceColors[index % deviceColors.length],
              label: formatLabel(item.deviceType),
              value: item.sessionCount,
            }))}
          />
        </article>
      </section>
      <section className={`${styles.panel} ${styles.resourceListPanel}`}>
        <PanelTitle
          detail="Device, browser, operating-system, and duration totals come from complete sessions."
          title="Access by device and browser"
        />
        <div className={styles.resourceTableWrap}>
          <table className={styles.resourceTable}>
            <thead>
              <tr>
                <th>Device</th>
                <th>Browser</th>
                <th>Operating system</th>
                <th>Sessions</th>
                <th>Active time</th>
                <th>Idle time</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {rawDevices.map((item, index) => {
                const DeviceIcon = deviceIcon(item.deviceType);
                const share = totalSessions
                  ? Math.round((item.sessionCount / totalSessions) * 100)
                  : 0;
                return (
                  <tr key={`${item.deviceType}-${item.browser}-${index}`}>
                    <td>
                      <div className={styles.resourceName}>
                        <span
                          className={`${styles.resourceIcon} ${styles.blue}`}
                        >
                          <DeviceIcon aria-hidden="true" size={16} />
                        </span>
                        <strong>{formatLabel(item.deviceType)}</strong>
                      </div>
                    </td>
                    <td>{item.browser ?? "Unknown"}</td>
                    <td>{item.operatingSystem ?? "Unknown"}</td>
                    <td>{item.sessionCount}</td>
                    <td>{formatDuration(item.activeDurationSeconds)}</td>
                    <td>{formatDuration(item.idleDurationSeconds)}</td>
                    <td>
                      <div className={styles.engagementCell}>
                        <strong>{share}%</strong>
                        <span>
                          <i style={{ width: `${share}%` }} />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PanelTitle({
  action,
  children,
  detail,
  title,
}: {
  action?: React.ReactNode;
  children?: React.ReactNode;
  detail: string;
  title: string;
}) {
  return (
    <header className={styles.panelHeader}>
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      {children}
      {action ? <div className={styles.panelAction}>{action}</div> : null}
    </header>
  );
}

function ActivityTrendChart({
  points,
}: {
  points: StudentActivityReportData["analytics"]["dailyTrend"];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!points.length) {
    return (
      <div className={styles.chartEmpty}>
        No learning-resource duration in this range.
      </div>
    );
  }
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [
      point.activeDurationSeconds,
      point.idleDurationSeconds,
    ]),
  );
  const chart = {
    bottom: 178,
    height: 158,
    left: 50,
    right: 682,
    top: 20,
    width: 632,
  };
  const x = (index: number) =>
    points.length === 1
      ? chart.left + chart.width / 2
      : chart.left + (index / (points.length - 1)) * chart.width;
  const y = (value: number) => chart.bottom - (value / maxValue) * chart.height;
  const activePoints = points
    .map((point, index) => `${x(index)},${y(point.activeDurationSeconds)}`)
    .join(" ");
  const idlePoints = points
    .map((point, index) => `${x(index)},${y(point.idleDurationSeconds)}`)
    .join(" ");
  const labelIndexes = [
    ...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]),
  ];
  const activeHoverIndex =
    hoveredIndex !== null && hoveredIndex < points.length ? hoveredIndex : null;
  const hoveredPoint =
    activeHoverIndex === null ? null : points[activeHoverIndex];

  return (
    <div
      className={styles.trendChart}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <svg
        aria-label="Active and idle resource time trend"
        role="img"
        viewBox="0 0 700 225"
      >
        <defs>
          <linearGradient id="activeArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#14b8a6" stopOpacity="0.32" />
            <stop offset="1" stopColor="#14b8a6" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="idleArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const lineY = chart.bottom - ratio * chart.height;
          return (
            <g key={ratio}>
              <line
                className={styles.gridLine}
                x1={chart.left}
                x2={chart.right}
                y1={lineY}
                y2={lineY}
              />
              <text
                className={styles.yAxisLabel}
                textAnchor="end"
                x={chart.left - 10}
                y={lineY + 4}
              >
                {formatAxisDuration(maxValue * ratio)}
              </text>
            </g>
          );
        })}
        <polygon
          fill="url(#activeArea)"
          points={`${chart.left},${chart.bottom} ${activePoints} ${chart.right},${chart.bottom}`}
        />
        <polygon
          fill="url(#idleArea)"
          points={`${chart.left},${chart.bottom} ${idlePoints} ${chart.right},${chart.bottom}`}
        />
        <polyline
          className={styles.activeLine}
          fill="none"
          points={activePoints}
        />
        <polyline className={styles.idleLine} fill="none" points={idlePoints} />
        {activeHoverIndex !== null ? (
          <line
            className={styles.hoverGuide}
            x1={x(activeHoverIndex)}
            x2={x(activeHoverIndex)}
            y1={chart.top}
            y2={chart.bottom}
          />
        ) : null}
        {points.map((point, index) => {
          const selected = index === activeHoverIndex;
          const hitWidth = Math.max(
            28,
            chart.width / Math.max(points.length, 1),
          );
          return (
            <g key={point.date}>
              <circle
                className={styles.activePoint}
                cx={x(index)}
                cy={y(point.activeDurationSeconds)}
                r={selected ? 5 : 3.5}
              />
              <circle
                className={styles.idlePoint}
                cx={x(index)}
                cy={y(point.idleDurationSeconds)}
                r={selected ? 5 : 3.5}
              />
              <rect
                aria-label={`${formatShortDate(point.date)}: ${formatDuration(point.activeDurationSeconds)} active, ${formatDuration(point.idleDurationSeconds)} idle`}
                className={styles.chartHitZone}
                height={chart.height + 18}
                onBlur={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                tabIndex={0}
                width={hitWidth}
                x={x(index) - hitWidth / 2}
                y={chart.top - 9}
              />
            </g>
          );
        })}
        {labelIndexes.map((index) => (
          <text
            className={styles.axisLabel}
            key={index}
            textAnchor={
              index === 0
                ? "start"
                : index === points.length - 1
                  ? "end"
                  : "middle"
            }
            x={x(index)}
            y="211"
          >
            {formatShortDate(points[index].date)}
          </text>
        ))}
      </svg>
      {hoveredPoint && activeHoverIndex !== null ? (
        <div
          className={styles.chartTooltip}
          style={{
            left: `${Math.min(88, Math.max(12, (x(activeHoverIndex) / 700) * 100))}%`,
          }}
        >
          <strong>{formatShortDate(hoveredPoint.date)}</strong>
          <span>
            <i style={{ background: "#14b8a6" }} />
            Active time
            <b>{formatDuration(hoveredPoint.activeDurationSeconds)}</b>
          </span>
          <span>
            <i style={{ background: "#f59e0b" }} />
            Idle time
            <b>{formatDuration(hoveredPoint.idleDurationSeconds)}</b>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function DonutBreakdown({
  centerLabel,
  segments,
}: {
  centerLabel: string;
  segments: Array<{ color: string; label: string; value: number }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let offset = 0;
  const gradient = total
    ? segments
        .map((segment) => {
          const start = offset;
          offset += (segment.value / total) * 100;
          return `${segment.color} ${start}% ${offset}%`;
        })
        .join(", ")
    : "#e2e8f0 0 100%";
  return (
    <div className={styles.donutLayout}>
      <div
        className={styles.donut}
        style={
          { "--donut-gradient": `conic-gradient(${gradient})` } as CSSProperties
        }
      >
        <div>
          <strong>{total.toLocaleString()}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <div className={styles.donutLegend}>
        {segments.map((segment) => (
          <div key={segment.label}>
            <i style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <strong>{segment.value.toLocaleString()}</strong>
            <small>
              {total ? `${Math.round((segment.value / total) * 100)}%` : "0%"}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegend({
  items,
}: {
  items: Array<{ color: string; label: string }>;
}) {
  return (
    <div className={styles.chartLegend}>
      {items.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ResourceEngagementRows({
  resources,
}: {
  resources: StudentActivityResourceBreakdown[];
}) {
  return (
    <div className={styles.engagementRows}>
      {resources.length ? (
        resources.map((resource, index) => {
          const Icon = resourceIcon(resource.resourceType);
          const engagement = engagementPercent(resource);
          const total =
            resource.activeDurationSeconds + resource.idleDurationSeconds;
          const idle = total ? 100 - engagement : 0;
          return (
            <article key={resourceKey(resource, index)}>
              <div className={styles.resourceName}>
                <span
                  className={`${styles.resourceIcon} ${styles[resourceTone(resource.resourceType)]}`}
                >
                  <Icon aria-hidden="true" size={15} />
                </span>
                <div>
                  <strong>{resource.resourceTitle}</strong>
                  <small>
                    {formatLabel(resource.resourceType)} ·{" "}
                    {resource.sessionCount} visits
                  </small>
                </div>
              </div>
              <span>{formatDuration(resource.activeDurationSeconds)}</span>
              <span>{formatDuration(resource.idleDurationSeconds)}</span>
              <div
                className={styles.splitBar}
                title={`${engagement}% active, ${idle}% idle`}
              >
                <i style={{ width: `${engagement}%` }} />
                <b style={{ width: `${idle}%` }} />
              </div>
            </article>
          );
        })
      ) : (
        <div className={styles.chartEmpty}>
          Activity will appear after this student opens a document or starts a
          video.
        </div>
      )}
    </div>
  );
}

function DeviceOverview({
  devices,
  rawDevices,
  segments,
}: {
  devices: AggregatedDevice[];
  rawDevices: StudentActivityDeviceBreakdown[];
  segments: Array<{ color: string; label: string; value: number }>;
}) {
  const browsers = useMemo(() => aggregateBrowsers(rawDevices), [rawDevices]);
  return (
    <div className={styles.deviceOverview}>
      <DonutBreakdown centerLabel="sessions" segments={segments} />
      <div className={styles.browserList}>
        <strong>Top browsers</strong>
        {browsers.slice(0, 3).map((browser) => (
          <div key={browser.browser}>
            <span>{browser.browser}</span>
            <b>{browser.sessions} sessions</b>
          </div>
        ))}
      </div>
      {!devices.length ? (
        <div className={styles.chartEmpty}>
          No device sessions in this range.
        </div>
      ) : null}
    </div>
  );
}

function ResourceTableRows({
  expanded,
  onToggle,
  resource,
  resourceIcon: Icon,
  engagement,
}: {
  expanded: boolean;
  onToggle: () => void;
  resource: StudentActivityResourceBreakdown;
  resourceIcon: typeof Video;
  engagement: number;
}) {
  return (
    <>
      <tr className={expanded ? styles.expandedResource : undefined}>
        <td>
          <div className={styles.resourceName}>
            <span
              className={`${styles.resourceIcon} ${styles[resourceTone(resource.resourceType)]}`}
            >
              <Icon aria-hidden="true" size={15} />
            </span>
            <strong>{resource.resourceTitle}</strong>
          </div>
        </td>
        <td>
          <span
            className={`${styles.typeBadge} ${styles[resourceTone(resource.resourceType)]}`}
          >
            {formatLabel(resource.resourceType)}
          </span>
        </td>
        <td>{resource.courseName ?? "—"}</td>
        <td>{resource.sessionCount}</td>
        <td>{formatDuration(resource.activeDurationSeconds)}</td>
        <td>{formatDuration(resource.idleDurationSeconds)}</td>
        <td>
          <div className={styles.engagementCell}>
            <strong>{engagement}%</strong>
            <span>
              <i style={{ width: `${engagement}%` }} />
            </span>
          </div>
        </td>
        <td>
          {resource.lastActivityAt
            ? formatDateTime(resource.lastActivityAt)
            : "—"}
        </td>
        <td>
          <button
            aria-expanded={expanded}
            aria-label={`View ${resource.resourceTitle} details`}
            className={styles.rowAction}
            onClick={onToggle}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={15} />
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className={styles.resourceDetailRow}>
          <td colSpan={9}>
            <div>
              <span>
                <strong>{engagement}%</strong> engagement
              </span>
              <span>
                <strong>{resource.sessionCount}</strong> resource sessions
              </span>
              <span>
                <strong>
                  {formatDuration(
                    resource.activeDurationSeconds +
                      resource.idleDurationSeconds,
                  )}
                </strong>{" "}
                total tracked time
              </span>
              <small>
                Engagement is active time divided by active plus idle time.
                Session, page, video, and exam details remain available in the
                exported workbook.
              </small>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

type AggregatedDevice = {
  deviceType: string;
  sessionCount: number;
  activeDurationSeconds: number;
  idleDurationSeconds: number;
};
function aggregateDevices(rows: StudentActivityDeviceBreakdown[]) {
  const result = new Map<string, AggregatedDevice>();
  for (const row of rows) {
    const item = result.get(row.deviceType) ?? {
      deviceType: row.deviceType,
      sessionCount: 0,
      activeDurationSeconds: 0,
      idleDurationSeconds: 0,
    };
    item.sessionCount += row.sessionCount;
    item.activeDurationSeconds += row.activeDurationSeconds;
    item.idleDurationSeconds += row.idleDurationSeconds;
    result.set(row.deviceType, item);
  }
  return [...result.values()].sort(
    (left, right) => right.sessionCount - left.sessionCount,
  );
}
function aggregateBrowsers(rows: StudentActivityDeviceBreakdown[]) {
  const result = new Map<string, number>();
  for (const row of rows) {
    const browser = row.browser ?? "Unknown browser";
    result.set(browser, (result.get(browser) ?? 0) + row.sessionCount);
  }
  return [...result.entries()]
    .map(([browser, sessions]) => ({ browser, sessions }))
    .sort((left, right) => right.sessions - left.sessions);
}
function engagementPercent(
  resource: Pick<
    StudentActivityResourceBreakdown,
    "activeDurationSeconds" | "idleDurationSeconds"
  >,
) {
  const total = resource.activeDurationSeconds + resource.idleDurationSeconds;
  return total ? Math.round((resource.activeDurationSeconds / total) * 100) : 0;
}
function resourceIcon(type: string) {
  if (type.toUpperCase() === "VIDEO") return Video;
  if (type.toUpperCase() === "DOCUMENT") return FileText;
  return CheckCircle2;
}
function resourceTone(type: string) {
  if (type.toUpperCase() === "VIDEO") return "green";
  if (type.toUpperCase() === "DOCUMENT") return "violet";
  return "orange";
}
function deviceIcon(type: string) {
  if (type.toUpperCase() === "MOBILE") return Smartphone;
  if (type.toUpperCase() === "TABLET") return Tablet;
  if (type.toUpperCase() === "DESKTOP") return Laptop;
  return MonitorSmartphone;
}
function resourceKey(
  resource: StudentActivityResourceBreakdown,
  index: number,
) {
  return `${resource.resourceId ?? resource.resourceTitle}-${resource.courseName ?? "course"}-${index}`;
}
function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${remaining}s`;
  return `${remaining}s`;
}
function formatAxisDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds >= 3600) {
    const hours = seconds / 3600;
    return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)}h`;
  }
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
