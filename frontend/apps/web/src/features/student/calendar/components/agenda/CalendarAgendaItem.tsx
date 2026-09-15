import { ChevronRight, Clock3 } from "lucide-react";
import type { StudentCalendarEvent } from "@repo/types";
import styles from "../../StudentCalendarPage.module.css";
import {
  formatDateTime,
  formatDayNumber,
  formatShortMonth,
} from "../../utils/calendarFormatting";

export const CalendarAgendaItem = ({
  event,
  onOpen,
  timezone,
}: {
  event: StudentCalendarEvent;
  onOpen: () => void;
  timezone: string;
}) => {
  const displayDate = new Date(
    event.status === "AVAILABLE" ? event.endsAt : event.startsAt,
  );
  return (
    <button className={styles.agendaItem} onClick={onOpen} type="button">
      <span className={styles.agendaDate}>
        <strong>{formatDayNumber(displayDate, timezone)}</strong>
        <small>{formatShortMonth(displayDate, timezone)}</small>
      </span>
      <span className={styles.agendaCopy}>
        <strong>{event.title}</strong>
        <small>{event.courses.map((course) => course.name).join(", ")}</small>
        <span>
          <Clock3 aria-hidden="true" size={12} />
          {event.status === "AVAILABLE"
            ? `Closes ${formatDateTime(event.endsAt, timezone)}`
            : `Opens ${formatDateTime(event.startsAt, timezone)}`}
        </span>
      </span>
      <ChevronRight aria-hidden="true" size={17} />
    </button>
  );
};
