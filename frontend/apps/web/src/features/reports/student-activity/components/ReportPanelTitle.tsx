import type { ReactNode } from "react";
import styles from "../styles/StudentActivityReportPage.module.css";

export const ReportPanelTitle = ({
  action,
  children,
  detail,
  title,
}: {
  action?: ReactNode;
  children?: ReactNode;
  detail: string;
  title: string;
}) => (
  <header className={styles.panelHeader}>
    <div>
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
    {children}
    {action ? <div className={styles.panelAction}>{action}</div> : null}
  </header>
);
