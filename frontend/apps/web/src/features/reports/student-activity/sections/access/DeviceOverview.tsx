import { useMemo } from "react";
import type { StudentActivityDeviceBreakdown } from "@repo/types";
import type { AggregatedDevice, DonutSegment } from "../../types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import { aggregateBrowsers } from "../../utils/aggregateBrowsers";
import { DonutBreakdown } from "../../components/charts/DonutBreakdown";

export const DeviceOverview = ({
  devices,
  rawDevices,
  segments,
}: {
  devices: AggregatedDevice[];
  rawDevices: StudentActivityDeviceBreakdown[];
  segments: DonutSegment[];
}) => {
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
};
