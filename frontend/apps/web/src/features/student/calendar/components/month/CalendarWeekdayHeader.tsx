import styles from "../../StudentCalendarPage.module.css";
import { weekdayLabels } from "../../constant";

export const CalendarWeekdayHeader = () => (
  <div className={styles.weekdayRow}>
    {weekdayLabels.map((label) => (
      <span key={label}>{label}</span>
    ))}
  </div>
);
