import type { OrganizationFiltersState } from "../types";

export interface OrganizationExportRequest {
  filters: OrganizationFiltersState;
  page: number;
  pageSize: number;
}

export type OrganizationExportRowId = string | number;

export function exportOrganizations(request: OrganizationExportRequest) {
  // Preserve the current placeholder behavior until an export API is connected.
  console.info("Export organizations", request);
}

export function exportSelectedOrganizations(
  selectedRowIds: readonly OrganizationExportRowId[],
) {
  // Preserve the current placeholder behavior until an export API is connected.
  console.info("Export selected", selectedRowIds);
}
