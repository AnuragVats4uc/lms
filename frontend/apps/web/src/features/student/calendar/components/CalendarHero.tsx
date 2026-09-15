import { CalendarDays, Clock3, GraduationCap } from "lucide-react";
import styles from "../StudentCalendarPage.module.css";
import {
  formatDayNumber,
  formatFullDate,
  formatMonthWeekday,
  humanizeTimezone,
} from "../utils/calendarFormatting";

export const CalendarHero = ({
  courseCount,
  timezone,
  today,
}: {
  courseCount: number;
  timezone: string;
  today: Date;
}) => (
  <section className={styles.hero}>
    <div className={styles.heroCopy}>
      <span className={styles.eyebrow}>STUDENT PLANNER</span>
      <h1>My calendar</h1>
      <p>
        Keep track of exam windows and your enrolled academic session in one
        reliable view.
      </p>
      <div className={styles.heroMeta}>
        <span>
          <Clock3 aria-hidden="true" size={14} />
          Times shown in {humanizeTimezone(timezone)}
        </span>
        <span>
          <GraduationCap aria-hidden="true" size={14} />
          {courseCount} enrolled course{courseCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
    <div
      aria-label={formatFullDate(today, timezone)}
      className={styles.heroDate}
    >
      <CalendarDays aria-hidden="true" size={20} />
      <div>
        <strong>{formatDayNumber(today, timezone)}</strong>
        <span>{formatMonthWeekday(today, timezone)}</span>
      </div>
    </div>
  </section>
);
