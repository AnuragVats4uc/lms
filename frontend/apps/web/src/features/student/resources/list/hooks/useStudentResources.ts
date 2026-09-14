import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { studentsApi } from "@repo/api";
import type { ResourceTypeId, StudentResourcesQuery } from "@repo/types";

import { ALL_RESOURCES, DEFAULT_PAGE_SIZE } from "../constants";
import type { ResourceFilterValues } from "../types";
import { createDefaultFilters } from "../utils/createDefaultFilters";

export const useStudentResources = (
  initialSearch: string,
  initialResourceTypeId?: ResourceTypeId,
) => {
  const [draftFilters, setDraftFilters] = useState(() =>
    createDefaultFilters(initialSearch, initialResourceTypeId),
  );
  const [appliedFilters, setAppliedFilters] = useState(() =>
    createDefaultFilters(initialSearch, initialResourceTypeId),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const resourceQuery = useMemo<StudentResourcesQuery>(
    () => ({
      page,
      limit: pageSize,
      search: appliedFilters.search || undefined,
      resourceTypeId:
        appliedFilters.resourceTypeId === ALL_RESOURCES
          ? undefined
          : (Number(appliedFilters.resourceTypeId) as ResourceTypeId),
      sessionCourseId:
        appliedFilters.courseId === ALL_RESOURCES
          ? undefined
          : Number(appliedFilters.courseId),
      folderId:
        appliedFilters.subjectId === ALL_RESOURCES
          ? undefined
          : Number(appliedFilters.subjectId),
      uploadedOn: appliedFilters.uploadedOn || undefined,
      status:
        appliedFilters.status === ALL_RESOURCES
          ? undefined
          : appliedFilters.status,
      sort: appliedFilters.sort,
    }),
    [appliedFilters, page, pageSize],
  );
  const resourcesQuery = useQuery({
    queryFn: () => studentsApi.findMyResources(resourceQuery),
    queryKey: ["student-resources", resourceQuery],
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const data = resourcesQuery.data;
  const subjectOptions =
    data?.filters.subjects.filter(
      (subject) =>
        draftFilters.courseId === ALL_RESOURCES ||
        subject.sessionCourseId === Number(draftFilters.courseId),
    ) ?? [];

  const updateFilter = <Key extends keyof ResourceFilterValues>(
    key: Key,
    value: ResourceFilterValues[Key],
  ) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };
  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };
  const resetFilters = () => {
    const reset = createDefaultFilters("", initialResourceTypeId);
    setDraftFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };
  const updateCourse = (courseId: string) => {
    setDraftFilters((current) => ({
      ...current,
      courseId,
      subjectId: ALL_RESOURCES,
    }));
  };
  const updatePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  return {
    applyFilters,
    data,
    draftFilters,
    filtersVisible,
    page,
    pageSize,
    resetFilters,
    resourcesQuery,
    setFiltersVisible,
    setPage,
    subjectOptions,
    updateCourse,
    updateFilter,
    updatePageSize,
  };
};
