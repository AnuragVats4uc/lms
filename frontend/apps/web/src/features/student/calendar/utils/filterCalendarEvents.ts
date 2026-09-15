import type { StudentCalendarEvent } from "@repo/types";
import type { CourseFilter, TypeFilter } from "../types";

export const filterCalendarEvents = (
  events: StudentCalendarEvent[],
  typeFilter: TypeFilter,
  courseId: CourseFilter,
  search: string,
) => {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  return events.filter((event) => {
    if (typeFilter !== "ALL" && event.type !== typeFilter) return false;
    if (
      courseId !== "ALL" &&
      !event.courses.some((course) => course.id === courseId)
    )
      return false;
    if (!normalizedSearch) return true;
    return [
      event.title,
      event.description,
      event.session.name,
      event.session.code,
      event.exam?.code,
      ...event.courses.flatMap((course) => [course.name, course.code]),
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch));
  });
};
