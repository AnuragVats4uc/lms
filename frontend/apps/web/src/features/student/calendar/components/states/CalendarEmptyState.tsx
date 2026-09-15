import { CalendarCheck2 } from "lucide-react";
import styles from "../../StudentCalendarPage.module.css";

export const CalendarEmptyState = ({ filtered }: { filtered: boolean }) => (
  <div className={styles.emptyState}>
    <span>
      <CalendarCheck2 aria-hidden="true" size={22} />
    </span>
    <strong>{filtered ? "No matching events" : "Nothing upcoming"}</strong>
    <p>
      {filtered
        ? "Try changing the course, type, or search filter."
        : "Your next scheduled exam will appear here."}
    </p>
  </div>
);
