import type { OrganizationSyncStatus } from "./organization.types";

export type CreatedDateFilter =
  "all" | "today" | "7d" | "30d" | "90d" | "custom";

export type SortOption =
  "newest" | "oldest" | "name-asc" | "name-desc" | "updated";

export interface OrganizationFiltersState {
  createdDate: CreatedDateFilter;
  search: string;
  sort: SortOption;
  status: "ALL" | "ACTIVE" | "INACTIVE";
  syncStatus: "ALL" | OrganizationSyncStatus;
}
