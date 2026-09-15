import { Search, X } from "lucide-react";
import type { StudentNotificationReadStatus } from "@repo/types";

import { readFilters } from "../constants";
import styles from "../StudentNotificationsPage.module.css";
import type { CategoryFilter } from "../types";

type NotificationsToolbarProps = {
  category: CategoryFilter;
  onReadStatusChange: (status: StudentNotificationReadStatus) => void;
  onSearchChange: (search: string) => void;
  readStatus: StudentNotificationReadStatus;
  search: string;
  unreadCount: number;
};

export const NotificationsToolbar = ({
  category,
  onReadStatusChange,
  onSearchChange,
  readStatus,
  search,
  unreadCount,
}: NotificationsToolbarProps) => (
  <div className={styles.toolbar}>
    <label className={styles.searchField}>
      <Search aria-hidden="true" size={17} />
      <span className={styles.srOnly}>Search notifications</span>
      <input
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search title or message"
        type="search"
        value={search}
      />
      {search ? (
        <button
          aria-label="Clear notification search"
          onClick={() => onSearchChange("")}
          type="button"
        >
          <X aria-hidden="true" size={14} />
        </button>
      ) : null}
    </label>
    <div
      aria-label="Filter notification read state"
      className={styles.statusTabs}
    >
      {readFilters.map((filter) => (
        <button
          aria-pressed={readStatus === filter.value}
          className={readStatus === filter.value ? styles.activeTab : undefined}
          key={filter.value}
          onClick={() => onReadStatusChange(filter.value)}
          type="button"
        >
          {filter.label}
          {filter.value === "UNREAD" && category === "ALL" && unreadCount ? (
            <span>{unreadCount}</span>
          ) : null}
        </button>
      ))}
    </div>
  </div>
);
