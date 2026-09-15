import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../StudentCalendarPage.module.css";
import { formatMonthTitle } from "../utils/calendarFormatting";

export const CalendarMonthHeader = ({
  goToToday,
  moveMonth,
  visibleMonth,
}: {
  goToToday: () => void;
  moveMonth: (offset: number) => void;
  visibleMonth: Date;
}) => (
  <div className={styles.calendarHeader}>
    <div>
      <span className={styles.eyebrow}>CALENDAR VIEW</span>
      <h2>{formatMonthTitle(visibleMonth)}</h2>
    </div>
    <div className={styles.monthControls}>
      <button
        aria-label="Previous month"
        onClick={() => moveMonth(-1)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>
      <button className={styles.todayButton} onClick={goToToday} type="button">
        Today
      </button>
      <button
        aria-label="Next month"
        onClick={() => moveMonth(1)}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </div>
  </div>
);
