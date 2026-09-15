import { useState } from "react";
import type { StudentReportActivityType } from "@repo/types";

export type ActivityReportFilterState = {
  activityType: "" | StudentReportActivityType;
  from: string;
  resourceType: string;
  sessionCourseId: string;
  to: string;
};

export const activityReportToday = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 29 * 86_400_000)
  .toISOString()
  .slice(0, 10);

export const initialActivityReportFilters: ActivityReportFilterState = {
  activityType: "",
  from: thirtyDaysAgo,
  resourceType: "",
  sessionCourseId: "",
  to: activityReportToday,
};

export const useActivityReportFilters = (resetPage: () => void) => {
  const [draftFilters, setDraftFilters] = useState(
    initialActivityReportFilters,
  );
  const [filters, setFilters] = useState(initialActivityReportFilters);
  const applyFilters = () => {
    setFilters(draftFilters);
    resetPage();
  };
  const resetFilters = () => {
    setDraftFilters(initialActivityReportFilters);
    setFilters(initialActivityReportFilters);
    resetPage();
  };
  return { applyFilters, draftFilters, filters, resetFilters, setDraftFilters };
};
