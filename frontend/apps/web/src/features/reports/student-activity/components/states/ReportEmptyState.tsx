import type { ReactNode } from "react";
import styles from "../../styles/StudentActivityReportPage.module.css";

export const ReportEmptyState = ({
  description,
  icon,
  title,
}: {
  description: string;
  icon?: ReactNode;
  title: string;
}) => (
  <div className={styles.chartEmpty}>
    {icon}
    <strong>{title}</strong>
    <span>{description}</span>
  </div>
);
