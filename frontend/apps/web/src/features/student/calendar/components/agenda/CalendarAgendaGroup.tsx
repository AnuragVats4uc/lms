import { CalendarClock, ChevronRight, GraduationCap } from "lucide-react";
import type { StudentCalendarEvent } from "@repo/types";
import styles from "../../StudentCalendarPage.module.css";
import { statusLabels } from "../../constant";
import { formatDateRange } from "../../utils/calendarFormatting";

export const CalendarAgendaGroup = ({
  events,
  label,
  onOpen,
  timezone,
}: {
  events: StudentCalendarEvent[];
  label: string;
  onOpen: (event: StudentCalendarEvent) => void;
  timezone: string;
}) => (
  <section className={styles.agendaGroup}>
    <h3>{label}</h3>
    <div>
      {events.map((event) => (
        <button
          className={styles.fullAgendaItem}
          data-status={event.status}
          key={event.id}
          onClick={() => onOpen(event)}
          type="button"
        >
          <span className={styles.agendaRail} />
          <span className={styles.fullAgendaIcon}>
            {event.type === "EXAM" ? (
              <CalendarClock aria-hidden="true" size={18} />
            ) : (
              <GraduationCap aria-hidden="true" size={18} />
            )}
          </span>
          <span className={styles.fullAgendaCopy}>
            <span>
              <strong>{event.title}</strong>
              <em data-status={event.status}>{statusLabels[event.status]}</em>
            </span>
            <small>{event.description ?? event.session.name}</small>
            <span className={styles.agendaMeta}>
              {formatDateRange(event, timezone)}
              {event.exam ? ` · ${event.exam.durationMinutes} minutes` : ""}
            </span>
          </span>
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      ))}
    </div>
  </section>
);
