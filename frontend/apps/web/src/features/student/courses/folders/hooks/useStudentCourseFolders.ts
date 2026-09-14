import { useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";

import { FOLDERS_PER_PAGE } from "../constant";
import type { FolderSort, FolderTypeFilter } from "../types";
import { filterCourseFolders } from "../utils/filterCourseFolders";

export const useStudentCourseFolders = (sessionCourseId: number) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FolderTypeFilter>("ALL");
  const [sort, setSort] = useState<FolderSort>("COURSE_ORDER");

  const query = useQuery({
    queryKey: ["student-course-folders", sessionCourseId],
    queryFn: () => studentsApi.findMyCourseFolders(sessionCourseId),
    staleTime: 30_000,
  });

  const folders = useMemo(
    () => query.data?.folders ?? [],
    [query.data?.folders],
  );
  const summary = useMemo(
    () =>
      folders.reduce(
        (totals, folder) => ({
          exams: totals.exams + folder.resourceCounts.exams,
          resources: totals.resources + folder.resourceCounts.total,
        }),
        { exams: 0, resources: 0 },
      ),
    [folders],
  );
  const filteredFolders = useMemo(
    () => filterCourseFolders({ folders, search, sort, typeFilter }),
    [folders, search, sort, typeFilter],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFolders.length / FOLDERS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const firstVisibleIndex = (currentPage - 1) * FOLDERS_PER_PAGE;
  const visibleFolders = filteredFolders.slice(
    firstVisibleIndex,
    firstVisibleIndex + FOLDERS_PER_PAGE,
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };
  const handleTypeFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(event.target.value as FolderTypeFilter);
    setPage(1);
  };
  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value as FolderSort);
    setPage(1);
  };
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setSort("COURSE_ORDER");
    setPage(1);
  };

  return {
    currentPage,
    filteredFolders,
    firstVisibleIndex,
    folders,
    handleSearchChange,
    handleSortChange,
    handleTypeFilterChange,
    query,
    resetFilters,
    search,
    setPage,
    sort,
    summary,
    totalPages,
    typeFilter,
    visibleFolders,
  };
};
