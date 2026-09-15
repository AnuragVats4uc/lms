import type { StudentCalendarEvent } from "@repo/types";
import type { CalendarMarker } from "../types";
import { timezoneDateKey } from "./calendarFormatting";

export const groupExamMarkersByDate = (
  events: StudentCalendarEvent[],
  timezone: string,
  today: Date,
) => {
  const markers = new Map<string, CalendarMarker[]>();
  for (const event of events) {
    const startKey = timezoneDateKey(event.startsAt, timezone);
    const endKey = timezoneDateKey(event.endsAt, timezone);
    const startKind = startKey === endKey ? "Exam" : "Opens";
    markers.set(startKey, [
      ...(markers.get(startKey) ?? []),
      { event, kind: startKind },
    ]);
    if (endKey !== startKey) {
      markers.set(endKey, [
        ...(markers.get(endKey) ?? []),
        { event, kind: "Closes" },
      ]);
    }
    if (event.status === "AVAILABLE") {
      const todayKey = timezoneDateKey(today.toISOString(), timezone);
      const hasTodayMarker = (markers.get(todayKey) ?? []).some(
        (marker) => marker.event.id === event.id,
      );
      if (!hasTodayMarker) {
        markers.set(todayKey, [
          ...(markers.get(todayKey) ?? []),
          { event, kind: "Available" },
        ]);
      }
    }
  }
  return markers;
};
