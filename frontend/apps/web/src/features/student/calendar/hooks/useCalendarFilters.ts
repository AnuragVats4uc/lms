import { useState } from "react";
import type { CalendarView, CourseFilter, TypeFilter } from "../types";

export const useCalendarFilters = () => {
  const [view, setView] = useState<CalendarView>("month");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [courseId, setCourseId] = useState<CourseFilter>("ALL");
  const [search, setSearch] = useState("");
  return {
    courseId,
    isFiltered: Boolean(search || typeFilter !== "ALL" || courseId !== "ALL"),
    search,
    setCourseId,
    setSearch,
    setTypeFilter,
    setView,
    typeFilter,
    view,
  };
};
