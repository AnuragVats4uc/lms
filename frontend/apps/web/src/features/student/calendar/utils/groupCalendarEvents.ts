import type {
  StudentCalendarEvent,
  StudentCalendarEventStatus,
} from "@repo/types";
import { agendaGroupLabel } from "./calendarFormatting";

const statusOrder: Record<StudentCalendarEventStatus, number> = {
  AVAILABLE: 0,
  UPCOMING: 1,
  ACTIVE: 2,
  CLOSED: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

export const groupCalendarEvents = (
  events: StudentCalendarEvent[],
  timezone: string,
) => {
  const groups = new Map<string, StudentCalendarEvent[]>();
  [...events]
    .sort(
      (first, second) =>
        statusOrder[first.status] - statusOrder[second.status] ||
        new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime(),
    )
    .forEach((event) => {
      const label = agendaGroupLabel(event, timezone);
      groups.set(label, [...(groups.get(label) ?? []), event]);
    });
  return [...groups.entries()];
};
