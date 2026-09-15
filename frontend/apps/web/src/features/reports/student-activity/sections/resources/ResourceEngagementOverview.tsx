import type { StudentActivityResourceBreakdown } from "@repo/types";
import { ReportPanelTitle } from "../../components/ReportPanelTitle";
import { ResourceEngagementRows } from "../../components/tables/ResourceEngagementRows";
import styles from "../../styles/StudentActivityReportPage.module.css";

export const ResourceEngagementOverview = ({
  resources,
}: {
  resources: StudentActivityResourceBreakdown[];
}) => (
  <article className={`${styles.panel} ${styles.compactPanel}`}>
    <ReportPanelTitle
      detail="Compare active and idle learning time by resource."
      title="Resource engagement"
    />
    <ResourceEngagementRows resources={resources} />
  </article>
);
