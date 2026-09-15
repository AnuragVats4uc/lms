import { BellRing, CheckCheck, Settings2 } from "lucide-react";
import Link from "next/link";

import styles from "../StudentNotificationsPage.module.css";

export const NotificationsHero = ({
  isMarkingAllRead,
  onMarkAllRead,
  unreadCount,
}: {
  isMarkingAllRead: boolean;
  onMarkAllRead: () => void;
  unreadCount: number;
}) => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>STUDENT UPDATES</span>
        <h1>Notification center</h1>
        <p>
          Keep exam deadlines, released results, learning resources and
          important account updates in one focused inbox.
        </p>
      </div>
      <div className={styles.heroActions}>
        <div aria-live="polite" className={styles.unreadSummary}>
          <span className={styles.heroBell}>
            <BellRing aria-hidden="true" size={21} />
          </span>
          <div>
            <strong>{unreadCount}</strong>
            <span>unread update{unreadCount === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className={styles.actionRow}>
          <button
            className={styles.secondaryAction}
            disabled={!unreadCount || isMarkingAllRead}
            onClick={onMarkAllRead}
            type="button"
          >
            <CheckCheck aria-hidden="true" size={16} />
            {isMarkingAllRead ? "Updating…" : "Mark all read"}
          </button>
          <Link
            className={styles.settingsAction}
            href="/student/profile#preferences"
          >
            <Settings2 aria-hidden="true" size={16} />
            Preferences
          </Link>
        </div>
      </div>
    </section>
  );
};
