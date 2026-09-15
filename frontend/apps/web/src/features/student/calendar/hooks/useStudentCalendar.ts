import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type { CourseFilter, TypeFilter } from "../types";
import { buildMonthGrid } from "../utils/buildMonthGrid";
import { calendarRange } from "../utils/calendarRange";
import { filterCalendarEvents } from "../utils/filterCalendarEvents";
import { groupExamMarkersByDate } from "../utils/groupExamMarkersByDate";

export const useStudentCalendar = ({
  courseId,
  search,
  today,
  typeFilter,
  visibleMonth,
}: {
  courseId: CourseFilter;
  search: string;
  today: Date;
  typeFilter: TypeFilter;
  visibleMonth: Date;
}) => {
  const range = useMemo(() => calendarRange(visibleMonth), [visibleMonth]);
  const query = useQuery({
    queryKey: ["student-calendar", range.from, range.to],
    queryFn: () => studentsApi.findMyCalendar(range),
    staleTime: 60_000,
  });
  const timezone = query.data?.timezone ?? "Asia/Kolkata";
  const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const filteredEvents = useMemo(
    () =>
      filterCalendarEvents(
        query.data?.events ?? [],
        typeFilter,
        courseId,
        search,
      ),
    [courseId, query.data?.events, search, typeFilter],
  );
  const examEvents = filteredEvents.filter((event) => event.type === "EXAM");
  const academicEvents = filteredEvents.filter(
    (event) => event.type === "ACADEMIC_SESSION",
  );
  const markersByDate = useMemo(
    () => groupExamMarkersByDate(examEvents, timezone, today),
    [examEvents, timezone, today],
  );
  const upcomingEvents = useMemo(
    () =>
      examEvents
        .filter((event) => ["UPCOMING", "AVAILABLE"].includes(event.status))
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )
        .slice(0, 5),
    [examEvents],
  );
  return {
    academicEvents,
    filteredEvents,
    markersByDate,
    monthDays,
    query,
    timezone,
    upcomingEvents,
  };
};
