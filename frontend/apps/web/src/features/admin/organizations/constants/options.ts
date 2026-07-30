import type { CreatedDateFilter, SortOption } from "../types";

export const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export const syncStatusOptions = [
  { label: "All", value: "ALL" },
  { label: "Synced", value: "SYNCED" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
];

export const createdDateOptions: Array<{
  label: string;
  value: CreatedDateFilter;
}> = [
  { label: "Any time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Custom Range", value: "custom" },
];

export const sortOptions: Array<{ label: string; value: SortOption }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Recently Updated", value: "updated" },
];
