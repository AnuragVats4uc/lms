import Link from "next/link";
import type { StudentNotificationItem } from "@repo/types";
import { ArrowRight } from "lucide-react";

import { categoryMeta } from "../constants";
import styles from "../StudentNotificationsPage.module.css";
import { relativeNotificationTime } from "../utils/notificationFormatting";

export const NotificationRow = ({
  isUpdating,
  notification,
  onToggleRead,
}: {
  isUpdating: boolean;
  notification: StudentNotificationItem;
  onToggleRead: (isRead: boolean) => void;
}) => {
  const meta = categoryMeta[notification.type];
  const Icon = meta.icon;
  return (
    <article
      className={styles.notificationRow}
      data-read={notification.isRead}
      data-tone={notification.type.toLocaleLowerCase()}
    >
      <span className={styles.notificationIcon}>
        <Icon aria-hidden="true" size={19} />
      </span>
      <div className={styles.notificationBody}>
        <div className={styles.notificationTitleRow}>
          <div>
            <span className={styles.notificationType}>{meta.label}</span>
            {!notification.isRead ? (
              <span className={styles.unreadPill}>New</span>
            ) : null}
          </div>
          <time dateTime={notification.createdAt}>
            {relativeNotificationTime(notification.createdAt)}
          </time>
        </div>
        <h3>{notification.title}</h3>
        <p>{notification.description}</p>
        <div className={styles.notificationFooter}>
          {notification.action ? (
            <Link
              className={styles.notificationAction}
              href={notification.action.href}
              onClick={() => {
                if (!notification.isRead) onToggleRead(true);
              }}
            >
              {notification.action.label}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          ) : (
            <span className={styles.informationOnly}>Information only</span>
          )}
          <button
            className={styles.readToggle}
            disabled={isUpdating}
            onClick={() => onToggleRead(!notification.isRead)}
            type="button"
          >
            {isUpdating
              ? "Updating…"
              : notification.isRead
                ? "Mark as unread"
                : "Mark as read"}
          </button>
        </div>
      </div>
    </article>
  );
};
