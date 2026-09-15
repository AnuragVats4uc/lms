import type { StudentActivityDeviceBreakdown } from "@repo/types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import { deviceIcon } from "../../utils/resourcePresentation";
import {
  formatDuration,
  formatLabel,
} from "../../utils/activityReportFormatting";

export const BrowserOverview = ({
  rows,
}: {
  rows: StudentActivityDeviceBreakdown[];
}) => {
  const totalSessions = rows.reduce((sum, item) => sum + item.sessionCount, 0);
  return (
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
          {rows.map((item, index) => {
            const DeviceIcon = deviceIcon(item.deviceType);
            const share = totalSessions
              ? Math.round((item.sessionCount / totalSessions) * 100)
              : 0;
            return (
              <tr key={`${item.deviceType}-${item.browser}-${index}`}>
                <td>
                  <div className={styles.resourceName}>
                    <span className={`${styles.resourceIcon} ${styles.blue}`}>
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
  );
};
