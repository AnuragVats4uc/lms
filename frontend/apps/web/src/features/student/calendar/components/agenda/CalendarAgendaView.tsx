import { useMemo } from "react";
import type { StudentCalendarEvent } from "@repo/types";
import styles from "../../StudentCalendarPage.module.css";
import { groupCalendarEvents } from "../../utils/groupCalendarEvents";
import { CalendarEmptyState } from "../states/CalendarEmptyState";
import { CalendarAgendaGroup } from "./CalendarAgendaGroup";

export const CalendarAgendaView = ({
  events,
  onOpen,
  timezone,
}: {
  events: StudentCalendarEvent[];
  onOpen: (event: StudentCalendarEvent) => void;
  timezone: string;
}) => {
  const groups = useMemo(
    () => groupCalendarEvents(events, timezone),
    [events, timezone],
  );
  if (!groups.length)
    return (
      <div className={styles.fullEmptyState}>
        <CalendarEmptyState filtered />
      </div>
    );
  return (
    <div className={styles.fullAgenda}>
      {groups.map(([label, items]) => (
        <CalendarAgendaGroup
          events={items}
          key={label}
          label={label}
          onOpen={onOpen}
          timezone={timezone}
        />
      ))}
    </div>
  );
};
