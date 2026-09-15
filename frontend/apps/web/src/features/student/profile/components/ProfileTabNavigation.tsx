import { tabs } from "../constants";
import styles from "../StudentProfilePage.module.css";
import type { ProfileTab } from "../types";

export const ProfileTabNavigation = ({
  activeTab,
  onChange,
}: {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}) => (
  <nav aria-label="Profile sections" className={styles.tabs}>
    {tabs.map((tab) => {
      const Icon = tab.icon;
      return (
        <button
          aria-current={activeTab === tab.id ? "page" : undefined}
          className={activeTab === tab.id ? styles.activeTab : undefined}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          <Icon size={16} />
          {tab.label}
        </button>
      );
    })}
  </nav>
);
