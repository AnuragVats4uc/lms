import type { CreatedDateFilter, OrganizationFiltersState } from "../types";

export type ActiveFilterChip = {
  id: string;
  label: string;
};

export const isWithinCreatedDate = (
  value: string,
  filter: CreatedDateFilter,
): boolean => {
  if (filter === "all" || filter === "custom") {
    return true;
  }

  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const now = new Date();
  const start = new Date(now);

  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (filter === "7d") {
    start.setDate(now.getDate() - 7);
  }

  if (filter === "30d") {
    start.setDate(now.getDate() - 30);
  }

  if (filter === "90d") {
    start.setDate(now.getDate() - 90);
  }

  return createdAt >= start;
};

export const getFiltersFromParams = (
  params: URLSearchParams,
): OrganizationFiltersState => {
  const status = params.get("status");
  const syncStatus = params.get("syncStatus");
  const createdDate = params.get("createdDate");
  const sort = params.get("sort");

  return {
    createdDate:
      createdDate === "today" ||
      createdDate === "7d" ||
      createdDate === "30d" ||
      createdDate === "90d" ||
      createdDate === "custom"
        ? createdDate
        : "all",
    search: params.get("search") ?? "",
    sort:
      sort === "oldest" ||
      sort === "name-asc" ||
      sort === "name-desc" ||
      sort === "updated"
        ? sort
        : "newest",
    status: status === "ACTIVE" || status === "INACTIVE" ? status : "ALL",
    syncStatus:
      syncStatus === "SYNCED" ||
      syncStatus === "PENDING" ||
      syncStatus === "FAILED"
        ? syncStatus
        : "ALL",
  };
};

export const getActiveFilterChips = (
  filters: OrganizationFiltersState,
): ActiveFilterChip[] => {
  const chips: ActiveFilterChip[] = [];

  if (filters.search) {
    chips.push({ id: "search", label: `Search: ${filters.search}` });
  }

  if (filters.status !== "ALL") {
    chips.push({ id: "status", label: `Status: ${filters.status}` });
  }

  if (filters.syncStatus !== "ALL") {
    chips.push({ id: "syncStatus", label: `Sync: ${filters.syncStatus}` });
  }

  if (filters.createdDate !== "all") {
    chips.push({
      id: "createdDate",
      label: `Created: ${filters.createdDate}`,
    });
  }

  if (filters.sort !== "newest") {
    chips.push({ id: "sort", label: `Sort: ${filters.sort}` });
  }

  return chips;
};
