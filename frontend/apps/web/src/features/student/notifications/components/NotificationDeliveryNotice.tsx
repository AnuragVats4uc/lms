import Link from "next/link";
import { CircleAlert } from "lucide-react";

import styles from "../StudentNotificationsPage.module.css";

export const NotificationDeliveryNotice = ({
  enabled,
}: {
  enabled: boolean;
}) => {
  if (enabled) return null;

  return (
    <section className={styles.deliveryNotice}>
      <CircleAlert aria-hidden="true" size={18} />
      <div>
        <strong>In-app notifications are paused</strong>
        <span>
          Existing updates remain available, but new optional notifications will
          not be delivered.
        </span>
      </div>
      <Link href="/student/profile#preferences">Review preferences</Link>
    </section>
  );
};
