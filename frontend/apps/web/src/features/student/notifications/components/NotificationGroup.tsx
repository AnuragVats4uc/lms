import type { StudentNotificationItem } from "@repo/types";

import styles from "../StudentNotificationsPage.module.css";
import type { NotificationDateGroup } from "../types";
import { NotificationRow } from "./NotificationRow";

type NotificationGroupProps = {
  group: NotificationDateGroup;
  onToggleRead: (
    notification: StudentNotificationItem,
    isRead: boolean,
  ) => void;
  updatingNotificationUuid: string | null;
};

export const NotificationGroup = ({
  group,
  onToggleRead,
  updatingNotificationUuid,
}: NotificationGroupProps) => (
  <section className={styles.notificationGroup}>
    <div className={styles.groupLabel}>
      <span>{group.label}</span>
      <i />
    </div>
    <div className={styles.notificationList}>
      {group.items.map((notification) => (
        <NotificationRow
          isUpdating={updatingNotificationUuid === notification.uuid}
          key={notification.uuid}
          notification={notification}
          onToggleRead={(isRead) => onToggleRead(notification, isRead)}
        />
      ))}
    </div>
  </section>
);
