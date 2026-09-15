import {
  CheckCircle2,
  LogIn,
  MonitorSmartphone,
  ShieldAlert,
} from "lucide-react";
import type { StudentActivityReportData } from "@repo/types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import { deviceColors } from "../../constants";
import { aggregateDevices } from "../../utils/aggregateDevices";
import { formatLabel } from "../../utils/activityReportFormatting";
import { DonutBreakdown } from "../../components/charts/DonutBreakdown";
import { ReportPanelTitle as PanelTitle } from "../../components/ReportPanelTitle";
import { DeviceOverview } from "./DeviceOverview";
import { BrowserOverview } from "./BrowserOverview";

export const StudentAccessActivity = ({
  report,
}: {
  report: StudentActivityReportData;
}) => {
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
        <BrowserOverview rows={rawDevices} />
      </section>
    </div>
  );
};
