"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SessionSortField, SessionStatus } from "@repo/types";

import { useSessionStore, DEFAULT_SESSION_FILTERS } from "../store";
import type { SessionFiltersState } from "../types";

export function useSessionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    filters,
    page,
    pageSize,
    setFilters,
    setPage,
    setPageSize,
    setSelectedRowIds,
  } = useSessionStore();
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(filters.search),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    [
      "organizationId",
      "search",
      "status",
      "sort",
      "order",
      "page",
      "limit",
    ].forEach((key) => params.delete(key));
    if (filters.organizationId !== null) {
      params.set("organizationId", String(filters.organizationId));
    }
    if (filters.search) params.set("search", filters.search);
    if (filters.status !== "ALL") params.set("status", filters.status);
    if (filters.sort !== "createdAt") params.set("sort", filters.sort);
    if (filters.order !== "desc") params.set("order", filters.order);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 10) params.set("limit", String(pageSize));
    const query = params.toString();
    if (query === searchParams.toString()) return;
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [filters, page, pageSize, pathname, router, searchParams]);

  const updateFilters = useCallback(
    (next: SessionFiltersState) => {
      setFilters(next);
      setPage(1);
      setSelectedRowIds([]);
    },
    [setFilters, setPage, setSelectedRowIds],
  );

  const clearFilters = useCallback(() => {
    setFilters((current) => ({
      ...DEFAULT_SESSION_FILTERS,
      organizationId: current.organizationId,
    }));
    setPage(1);
    setSelectedRowIds([]);
  }, [setFilters, setPage, setSelectedRowIds]);

  const handlePageSizeChange = useCallback(
    (value: number) => {
      setPageSize(value);
      setPage(1);
    },
    [setPage, setPageSize],
  );

  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string }> = [];
    if (filters.search)
      chips.push({ id: "search", label: `Search: ${filters.search}` });
    if (filters.organizationId !== null) {
      chips.push({
        id: "organizationId",
        label: `Organization: ${filters.organizationId}`,
      });
    }
    if (filters.status !== "ALL")
      chips.push({ id: "status", label: `Status: ${filters.status}` });
    if (filters.sort !== "createdAt" || filters.order !== "desc") {
      chips.push({
        id: "sort",
        label: `Sort: ${filters.sort} ${filters.order}`,
      });
    }
    return chips;
  }, [filters]);

  const removeFilter = useCallback(
    (id: string) => {
      if (id === "organizationId") return;
      if (id === "search") updateFilters({ ...filters, search: "" });
      if (id === "status") updateFilters({ ...filters, status: "ALL" });
      if (id === "sort")
        updateFilters({ ...filters, sort: "createdAt", order: "desc" });
    },
    [filters, updateFilters],
  );

  const updateSort = useCallback(
    (sort: SessionSortField, order: "asc" | "desc") =>
      updateFilters({ ...filters, sort, order }),
    [filters, updateFilters],
  );

  const updateStatus = useCallback(
    (status: SessionStatus | "ALL") => updateFilters({ ...filters, status }),
    [filters, updateFilters],
  );

  return {
    activeChips,
    clearFilters,
    debouncedSearch,
    filters,
    hasFilters: activeChips.length > 0,
    handlePageSizeChange,
    page,
    pageSize,
    removeFilter,
    updateFilters,
    updateSort,
    updateStatus,
    setPage,
  };
}
