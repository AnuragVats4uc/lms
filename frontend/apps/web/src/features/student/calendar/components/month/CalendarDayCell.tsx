import type { StudentCalendarEvent } from "@repo/types";
import type { CalendarMarker } from "../../types";
import styles from "../../StudentCalendarPage.module.css";
import { localDateKey } from "../../utils/calendarFormatting";
import { CalendarEventPill } from "./CalendarEventPill";

export const CalendarDayCell = ({
  date,
  markers,
  onMore,
  onOpen,
  today,
  visibleMonth,
}: {
  date: Date;
  markers: CalendarMarker[];
  onMore: () => void;
  onOpen: (event: StudentCalendarEvent) => void;
  today: Date;
  visibleMonth: Date;
}) => {
  const dateKey = localDateKey(date);
  const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
  const isToday = dateKey === localDateKey(today);
  return (
    <div
      className={`${styles.dayCell} ${isCurrentMonth ? "" : styles.outsideMonth} ${isToday ? styles.todayCell : ""}`}
    >
      <div className={styles.dayNumberRow}>
        <span className={styles.dayNumber}>{date.getDate()}</span>
        {isToday ? <span className={styles.todayLabel}>Today</span> : null}
      </div>
      <div className={styles.dayEvents}>
        {markers.slice(0, 3).map((marker) => (
          <CalendarEventPill
            key={`${marker.event.id}:${marker.kind}`}
            marker={marker}
            onOpen={() => onOpen(marker.event)}
          />
        ))}
        {markers.length > 3 ? (
          <button className={styles.moreEvents} onClick={onMore} type="button">
            +{markers.length - 3} more
          </button>
        ) : null}
      </div>
    </div>
  );
};
