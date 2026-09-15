import { CircleAlert, RefreshCw } from "lucide-react";

import styles from "../../StudentNotificationsPage.module.css";

export const NotificationsErrorState = ({
  onRetry,
}: {
  onRetry: () => void;
}) => {
  return (
    <main className={`${styles.page} ${styles.errorPage}`}>
      <section className={styles.errorState}>
        <span>
          <CircleAlert aria-hidden="true" size={25} />
        </span>
        <h1>Notifications could not be loaded</h1>
        <p>Check your connection and try again. Your read state is safe.</p>
        <button onClick={onRetry} type="button">
          <RefreshCw aria-hidden="true" size={16} />
          Try again
        </button>
      </section>
    </main>
  );
};
