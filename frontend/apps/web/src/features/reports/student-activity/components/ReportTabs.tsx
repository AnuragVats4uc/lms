import styles from "../styles/StudentActivityReportPage.module.css";
import { reportTabs } from "../constants";
import type { ActivityReportTab } from "../hooks/useActivityReportTabs";

export const ReportTabs = ({
  activeTab,
  onSelect,
}: {
  activeTab: ActivityReportTab;
  onSelect: (tab: ActivityReportTab) => void;
}) => (
  <nav aria-label="Activity report sections" className={styles.tabs}>
    {reportTabs.map(({ id, icon: Icon, label }) => (
      <button
        aria-selected={activeTab === id}
        className={activeTab === id ? styles.activeTab : undefined}
        key={id}
        onClick={() => onSelect(id)}
        role="tab"
        type="button"
      >
        <Icon aria-hidden="true" size={15} />
        {label}
      </button>
    ))}
  </nav>
);
