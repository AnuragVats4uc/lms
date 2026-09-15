import type { StudentCalendarEvent } from "@repo/types";
import type { CalendarMarker } from "../../types";
import styles from "../../StudentCalendarPage.module.css";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { UpcomingEventsPanel } from "./UpcomingEventsPanel";

export const CalendarMonthView = ({
  filtered,
  markersByDate,
  monthDays,
  onAgenda,
  onOpen,
  timezone,
  today,
  upcomingEvents,
  visibleMonth,
}: {
  filtered: boolean;
  markersByDate: Map<string, CalendarMarker[]>;
  monthDays: Date[];
  onAgenda: () => void;
  onOpen: (event: StudentCalendarEvent) => void;
  timezone: string;
  today: Date;
  upcomingEvents: StudentCalendarEvent[];
  visibleMonth: Date;
}) => (
  <div className={styles.calendarLayout}>
    <CalendarMonthGrid
      markersByDate={markersByDate}
      monthDays={monthDays}
      onMore={onAgenda}
      onOpen={onOpen}
      today={today}
      visibleMonth={visibleMonth}
    />
    <UpcomingEventsPanel
      events={upcomingEvents}
      filtered={filtered}
      onOpen={onOpen}
      timezone={timezone}
    />
  </div>
);
