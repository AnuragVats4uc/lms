import type { OrganizationFiltersState } from "../types";

export const DEFAULT_FILTERS: OrganizationFiltersState = {
  createdDate: "all",
  search: "",
  sort: "newest",
  status: "ALL",
  syncStatus: "ALL",
};

// Compatibility export for modules that still import form defaults from constants.
export { DEFAULT_FORM } from "../forms/defaults";
