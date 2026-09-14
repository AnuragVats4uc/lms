import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type {
  ResourceTypeId,
  StudentFolderResourcesQuery,
  StudentResourcesSort,
} from "@repo/types";
import type { CrudFilterDefinition } from "@/features/admin/components/crud";

import {
  ALL_FOLDER_RESOURCES,
  FOLDER_RESOURCES_PAGE_SIZE,
  folderResourceSortOptions,
} from "../constants";
import {
  defaultFolderResourceFilters,
  type FolderResourceFilters,
} from "../types";

export function useStudentFolderResources(
  sessionCourseId: number,
  folderId: number,
) {
  const [filters, setFilters] = useState(defaultFolderResourceFilters);
  const [page, setPage] = useState(1);
  const params = useMemo<StudentFolderResourcesQuery>(
    () => ({
      page,
      limit: FOLDER_RESOURCES_PAGE_SIZE,
      search: filters.search || undefined,
      resourceTypeId:
        filters.type === ALL_FOLDER_RESOURCES
          ? undefined
          : (Number(filters.type) as ResourceTypeId),
      uploadedOn: filters.uploadedOn || undefined,
      sort: filters.sort,
    }),
    [filters, page],
  );
  const query = useQuery({
    queryKey: ["student-folder-resources", sessionCourseId, folderId, params],
    queryFn: () =>
      studentsApi.findMyFolderResources(sessionCourseId, folderId, params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
  const typeOptions = useMemo(
    () => [
      { label: "All types", value: ALL_FOLDER_RESOURCES },
      ...(query.data?.filters.types ?? []).map((type) => ({
        label: type.name,
        value: String(type.id),
      })),
    ],
    [query.data?.filters.types],
  );
  const filterDefinitions = useMemo<CrudFilterDefinition[]>(
    () => [
      { id: "type", label: "Type", options: typeOptions },
      { id: "sort", label: "Sort by", options: folderResourceSortOptions },
    ],
    [typeOptions],
  );

  const resetFilters = () => {
    setFilters(defaultFolderResourceFilters);
    setPage(1);
  };
  const updateFilter = (id: string, value: string) => {
    setPage(1);
    if (id === "type") {
      setFilters((current) => ({
        ...current,
        type: value as FolderResourceFilters["type"],
      }));
    } else if (id === "sort") {
      setFilters((current) => ({
        ...current,
        sort: value as StudentResourcesSort,
      }));
    }
  };
  const updateSearch = (search: string) => {
    setFilters((current) => ({ ...current, search }));
    setPage(1);
  };
  const updateUploadDate = (uploadedOn: string) => {
    setFilters((current) => ({ ...current, uploadedOn }));
    setPage(1);
  };

  return {
    data: query.data,
    filterDefinitions,
    filters,
    page,
    query,
    resetFilters,
    setPage,
    updateFilter,
    updateSearch,
    updateUploadDate,
  };
}
