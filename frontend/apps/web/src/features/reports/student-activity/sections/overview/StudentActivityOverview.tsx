import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock3,
  ImageIcon,
  MousePointerClick,
  ShieldAlert,
} from "lucide-react";
import type { StudentActivityReportData } from "@repo/types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import { categoryColors, deviceColors } from "../../constants";
import { aggregateDevices } from "../../utils/aggregateDevices";
import {
  formatDateTime,
  formatDuration,
  formatLabel,
} from "../../utils/activityReportFormatting";
import { ActivityTrendChart } from "../../components/charts/ActivityTrendChart";
import { ChartLegend } from "../../components/charts/ChartLegend";
import { DonutBreakdown } from "../../components/charts/DonutBreakdown";
import { ReportPanelTitle as PanelTitle } from "../../components/ReportPanelTitle";
import { ResourceEngagementRows } from "../../components/tables/ResourceEngagementRows";
import { DeviceOverview } from "../access/DeviceOverview";
import { ActivitySummaryGrid } from "./ActivitySummaryGrid";

export const StudentActivityOverview = ({
  onSelectTab,
  report,
}: {
  onSelectTab: (tab: "timeline" | "resources" | "access") => void;
  report: StudentActivityReportData;
}) => {
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
      caption: `${report.summary.landingPageViews ?? 0} views · ${report.summary.landingCardClicks ?? 0} card clicks`,
      icon: MousePointerClick,
      label: "Landing engagement",
      tone: "blue",
      value: (report.summary.landingCardClicks ?? 0).toLocaleString(),
    },
    {
      caption: `${report.summary.dashboardBannerImpressions ?? 0} impressions · ${report.summary.dashboardBannerClicks ?? 0} CTA clicks`,
      icon: ImageIcon,
      label: "Banner engagement",
      tone: "green",
      value: (report.summary.dashboardBannerClicks ?? 0).toLocaleString(),
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
      <ActivitySummaryGrid cards={summaryCards} />

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

        <article className={`${styles.panel} ${styles.compactPanel}`}>
          <PanelTitle
            action={
              <button onClick={() => onSelectTab("timeline")} type="button">
                View landing events <ArrowRight aria-hidden="true" size={14} />
              </button>
            }
            detail="Student clicks grouped by the destination card shown after login."
            title="Landing card engagement"
          />
          <div className={styles.landingEngagementRows}>
            {report.landingCardBreakdown?.length ? (
              report.landingCardBreakdown.slice(0, 4).map((card) => (
                <article key={`${card.landingCardId}:${card.title}`}>
                  <div>
                    <strong>{card.title}</strong>
                    <small>{card.ctaLabel ?? "Card action"}</small>
                  </div>
                  <span>{card.clickCount.toLocaleString()} clicks</span>
                </article>
              ))
            ) : (
              <p>No landing card clicks in this range.</p>
            )}
          </div>
          <article className={`${styles.panel} ${styles.compactPanel}`}>
            <PanelTitle
              action={
                <button onClick={() => onSelectTab("timeline")} type="button">
                  View banner events <ArrowRight aria-hidden="true" size={14} />
                </button>
              }
              detail="Impressions, CTA clicks and video engagement for dashboard banners."
              title="Dashboard banner engagement"
            />
            <div className={styles.landingEngagementRows}>
              {report.dashboardBannerBreakdown?.length ? (
                report.dashboardBannerBreakdown.slice(0, 4).map((banner) => (
                  <article key={`${banner.dashboardBannerId}:${banner.title}`}>
                    <div>
                      <strong>{banner.title}</strong>
                      <small>
                        {banner.videoPlays} plays · {banner.videoCompletions}{" "}
                        completions
                      </small>
                    </div>
                    <span>
                      {banner.impressions} views · {banner.clicks} clicks
                    </span>
                  </article>
                ))
              ) : (
                <p>No dashboard banner activity in this range.</p>
              )}
            </div>
          </article>
        </article>
      </section>
    </div>
  );
};
