import type { StudentCalendarEvent } from "@repo/types";
import styles from "../../StudentCalendarPage.module.css";
import { CalendarAgendaItem } from "../agenda/CalendarAgendaItem";
import { CalendarEmptyState } from "../states/CalendarEmptyState";

export const UpcomingEventsPanel = ({
  events,
  filtered,
  onOpen,
  timezone,
}: {
  events: StudentCalendarEvent[];
  filtered: boolean;
  onOpen: (event: StudentCalendarEvent) => void;
  timezone: string;
}) => (
  <aside className={styles.agendaPanel}>
    <div className={styles.panelHeading}>
      <div>
        <span className={styles.eyebrow}>NEXT UP</span>
        <h3>Upcoming exams</h3>
      </div>
      <span>{events.length}</span>
    </div>
    <div className={styles.agendaList}>
      {events.length ? (
        events.map((event) => (
          <CalendarAgendaItem
            event={event}
            key={event.id}
            onOpen={() => onOpen(event)}
            timezone={timezone}
          />
        ))
      ) : (
        <CalendarEmptyState filtered={filtered} />
      )}
    </div>
  </aside>
);
