"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DEFAULT_FILTERS } from "../constants";
import { useOrganizationStore } from "../store";
import type { OrganizationFiltersState, OrganizationTableRow } from "../types";
import { getActiveFilterChips, isWithinCreatedDate, sortRows } from "../utils";

export const useOrganizationFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { filters, page, pageSize, setFilters, setPage, setPageSize } =
    useOrganizationStore();

  const activeChips = useMemo(() => getActiveFilterChips(filters), [filters]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (filters.search) params.set("search", filters.search);
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.syncStatus !== "ALL") {
      params.set("syncStatus", filters.syncStatus);
    }
    if (filters.createdDate !== "all") {
      params.set("createdDate", filters.createdDate);
    }
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [filters, page, pageSize, pathname, router]);

  const updateFilters = useCallback(
    (nextFilters: OrganizationFiltersState) => {
      setFilters(nextFilters);
      setPage(1);
    },
    [setFilters, setPage],
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, [setFilters, setPage]);

  const removeFilter = useCallback(
    (id: string) => {
      updateFilters({
        ...filters,
        [id]:
          id === "search"
            ? ""
            : id === "sort"
              ? "newest"
              : id === "createdDate"
                ? "all"
                : "ALL",
      } as OrganizationFiltersState);
    },
    [filters, updateFilters],
  );

  const filterRows = useCallback(
    (rows: OrganizationTableRow[]) => {
      const syncFiltered =
        filters.syncStatus === "ALL"
          ? rows
          : rows.filter((row) => row.syncStatus === filters.syncStatus);
      const dateFiltered = syncFiltered.filter((row) =>
        isWithinCreatedDate(row.createdAt, filters.createdDate),
      );
      return sortRows(dateFiltered, filters.sort);
    },
    [filters],
  );

  const handlePageSizeChange = useCallback(
    (value: number) => {
      setPageSize(value);
      setPage(1);
    },
    [setPage, setPageSize],
  );

  return {
    activeChips,
    clearFilters,
    filterRows,
    filters,
    hasFilters: activeChips.length > 0,
    handlePageSizeChange,
    page,
    pageSize,
    removeFilter,
    setPage,
    updateFilters,
  };
};
