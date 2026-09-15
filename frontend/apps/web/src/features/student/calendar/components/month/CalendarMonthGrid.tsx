import type { StudentCalendarEvent } from "@repo/types";
import type { CalendarMarker } from "../../types";
import styles from "../../StudentCalendarPage.module.css";
import { localDateKey } from "../../utils/calendarFormatting";
import { CalendarDayCell } from "./CalendarDayCell";
import { CalendarWeekdayHeader } from "./CalendarWeekdayHeader";

export const CalendarMonthGrid = ({
  markersByDate,
  monthDays,
  onMore,
  onOpen,
  today,
  visibleMonth,
}: {
  markersByDate: Map<string, CalendarMarker[]>;
  monthDays: Date[];
  onMore: () => void;
  onOpen: (event: StudentCalendarEvent) => void;
  today: Date;
  visibleMonth: Date;
}) => (
  <div className={styles.monthPanel}>
    <CalendarWeekdayHeader />
    <div className={styles.monthGrid}>
      {monthDays.map((date) => (
        <CalendarDayCell
          date={date}
          key={localDateKey(date)}
          markers={markersByDate.get(localDateKey(date)) ?? []}
          onMore={onMore}
          onOpen={onOpen}
          today={today}
          visibleMonth={visibleMonth}
        />
      ))}
    </div>
  </div>
);
