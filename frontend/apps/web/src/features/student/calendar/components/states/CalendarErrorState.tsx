import { CircleAlert, RefreshCw } from "lucide-react";
import styles from "../../StudentCalendarPage.module.css";

export const CalendarErrorState = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <main className={styles.errorState}>
      <span>
        <CircleAlert aria-hidden="true" size={26} />
      </span>
      <h1>Calendar could not be loaded</h1>
      <p>Your schedule is safe. Check your connection and try again.</p>
      <button onClick={onRetry} type="button">
        <RefreshCw aria-hidden="true" size={16} />
        Retry
      </button>
    </main>
  );
};
