"use client";

import { useCallback } from "react";

import {
  exportOrganizations as runOrganizationExport,
  exportSelectedOrganizations as runSelectedOrganizationExport,
} from "../services";
import type { DataTableRowId } from "../table";
import type { OrganizationFiltersState } from "../types";

interface UseOrganizationExportOptions {
  filters: OrganizationFiltersState;
  page: number;
  pageSize: number;
  selectedRowIds: DataTableRowId[];
}

export const useOrganizationExport = ({
  filters,
  page,
  pageSize,
  selectedRowIds,
}: UseOrganizationExportOptions) => {
  const exportOrganizations = useCallback(() => {
    runOrganizationExport({ filters, page, pageSize });
  }, [filters, page, pageSize]);

  const exportSelectedOrganizations = useCallback(() => {
    runSelectedOrganizationExport(selectedRowIds);
  }, [selectedRowIds]);

  return {
    exportOrganizations,
    exportSelectedOrganizations,
  };
};
