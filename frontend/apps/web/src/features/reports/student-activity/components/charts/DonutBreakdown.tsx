import type { CSSProperties } from "react";
import type { DonutSegment } from "../../types";
import styles from "../../styles/StudentActivityReportPage.module.css";

export const DonutBreakdown = ({
  centerLabel,
  segments,
}: {
  centerLabel: string;
  segments: DonutSegment[];
}) => {
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
};
