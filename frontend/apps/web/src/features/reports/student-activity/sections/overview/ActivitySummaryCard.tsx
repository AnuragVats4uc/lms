import type { LucideIcon } from "lucide-react";
import styles from "../../styles/StudentActivityReportPage.module.css";

export const ActivitySummaryCard = ({
  caption,
  icon: Icon,
  label,
  tone,
  value,
}: {
  caption: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  value: string;
}) => (
  <article className={styles.summaryCard}>
    <div className={`${styles.metricIcon} ${styles[tone]}`}>
      <Icon aria-hidden="true" size={20} />
    </div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </div>
  </article>
);
