import { availabilityOptions } from "../constants";
import type {
  AvailabilityFilter,
  CreatedDateFilter,
  OrganizationFiltersState,
  OrganizationTableRow,
} from "../types";

export type ActiveFilterChip = {
  id: string;
  label: string;
};

export function isWithinCreatedDate(
  value: string,
  filter: CreatedDateFilter,
): boolean {
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
}

export function applyAvailabilityFilters(
  rows: OrganizationTableRow[],
  availability: AvailabilityFilter[],
): OrganizationTableRow[] {
  if (!availability.length) {
    return rows;
  }

  return rows.filter((row) =>
    availability.every((filter) => {
      if (filter === "website") return Boolean(row.website);
      if (filter === "email") return Boolean(row.email);
      if (filter === "phone") return Boolean(row.phone);
      if (filter === "logo") return Boolean(row.logo);
      if (filter === "administrator") return Boolean(row.primaryAdministrator);
      if (filter === "courses") return row.metrics.courses > 0;
      if (filter === "students") return row.metrics.students > 0;

      return true;
    }),
  );
}

export function getFiltersFromParams(
  params: URLSearchParams,
): OrganizationFiltersState {
  const status = params.get("status");
  const syncStatus = params.get("syncStatus");
  const createdDate = params.get("createdDate");
  const sort = params.get("sort");
  const availability = params
    .getAll("has")
    .filter((value): value is AvailabilityFilter =>
      availabilityOptions.some((option) => option.value === value),
    );

  return {
    availability,
    createdBy: params.get("createdBy") ?? "",
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
    updatedBy: params.get("updatedBy") ?? "",
  };
}

export function getActiveFilterChips(
  filters: OrganizationFiltersState,
): ActiveFilterChip[] {
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

  if (filters.createdBy) {
    chips.push({
      id: "createdBy",
      label: `Created by: ${filters.createdBy}`,
    });
  }

  if (filters.updatedBy) {
    chips.push({
      id: "updatedBy",
      label: `Updated by: ${filters.updatedBy}`,
    });
  }

  filters.availability.forEach((value) => {
    const option = availabilityOptions.find((item) => item.value === value);

    chips.push({
      id: `has:${value}`,
      label: option?.label ?? value,
    });
  });

  return chips;
}
