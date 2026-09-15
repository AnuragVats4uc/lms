import { RefreshCw } from "lucide-react";
import type {
  StudentNotificationItem,
  StudentNotificationReadStatus,
  StudentNotificationsResponse,
} from "@repo/types";

import { categoryMeta } from "../constants";
import styles from "../StudentNotificationsPage.module.css";
import type { CategoryFilter, NotificationDateGroup } from "../types";
import { notificationInboxDescription } from "../utils/notificationFormatting";
import { NotificationGroup } from "./NotificationGroup";
import { NotificationsPagination } from "./NotificationsPagination";
import { NotificationsToolbar } from "./NotificationsToolbar";
import { EmptyNotificationsState } from "./states/EmptyNotificationsState";

type NotificationsInboxProps = {
  category: CategoryFilter;
  data: StudentNotificationsResponse;
  deferredSearch: string;
  groups: NotificationDateGroup[];
  isFetching: boolean;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onReadStatusChange: (status: StudentNotificationReadStatus) => void;
  onRefresh: () => void;
  onSearchChange: (search: string) => void;
  onToggleRead: (
    notification: StudentNotificationItem,
    isRead: boolean,
  ) => void;
  page: number;
  readStatus: StudentNotificationReadStatus;
  search: string;
  updatingNotificationUuid: string | null;
};

export const NotificationsInbox = ({
  category,
  data,
  deferredSearch,
  groups,
  isFetching,
  onClearFilters,
  onPageChange,
  onReadStatusChange,
  onRefresh,
  onSearchChange,
  onToggleRead,
  page,
  readStatus,
  search,
  updatingNotificationUuid,
}: NotificationsInboxProps) => (
  <section className={styles.inboxPanel}>
    <div className={styles.inboxHeader}>
      <div>
        <span className={styles.sectionEyebrow}>YOUR INBOX</span>
        <h2>
          {category === "ALL"
            ? "All notifications"
            : categoryMeta[category].label}
        </h2>
        <p aria-live="polite">
          {notificationInboxDescription(category, readStatus, data.meta.total)}
        </p>
      </div>
      <button
        aria-label="Refresh notifications"
        className={styles.refreshButton}
        disabled={isFetching}
        onClick={onRefresh}
        type="button"
      >
        <RefreshCw
          aria-hidden="true"
          className={isFetching ? styles.spinning : undefined}
          size={16}
        />
      </button>
    </div>

    <NotificationsToolbar
      category={category}
      onReadStatusChange={onReadStatusChange}
      onSearchChange={onSearchChange}
      readStatus={readStatus}
      search={search}
      unreadCount={data.summary.unread}
    />

    {groups.length ? (
      <div className={styles.notificationGroups}>
        {groups.map((group) => (
          <NotificationGroup
            group={group}
            key={group.label}
            onToggleRead={onToggleRead}
            updatingNotificationUuid={updatingNotificationUuid}
          />
        ))}
      </div>
    ) : (
      <EmptyNotificationsState
        filtered={Boolean(
          deferredSearch || category !== "ALL" || readStatus !== "ALL",
        )}
        onClear={onClearFilters}
      />
    )}

    <NotificationsPagination
      onPageChange={onPageChange}
      page={page}
      totalPages={data.meta.totalPages}
    />
  </section>
);
