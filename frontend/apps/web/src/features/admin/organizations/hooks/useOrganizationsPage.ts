"use client";

import { useMemo } from "react";

import { useOrganizationStore } from "../store";
import { useOrganizationActions } from "./useOrganizationActions";
import { useOrganizationExport } from "./useOrganizationExport";
import { useOrganizationFilters } from "./useOrganizationFilters";
import { useOrganizationForm } from "./useOrganizationForm";
import { useOrganizations } from "./useOrganizations";
import { useOrganizationSelection } from "./useOrganizationSelection";
import { useOrganizationStatistics } from "./useOrganizationStatistics";

export function useOrganizationsPage() {
  const { isSidePanelOpen } = useOrganizationStore();
  const filters = useOrganizationFilters();
  const organizations = useOrganizations({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.filters.search,
    status: filters.filters.status,
  });
  const filteredRows = useMemo(
    () => filters.filterRows(organizations.rows),
    [filters.filterRows, organizations.rows],
  );
  const selection = useOrganizationSelection({
    rows: organizations.rows,
    visibleRows: filteredRows,
  });
  const statistics = useOrganizationStatistics(
    organizations.rows,
    organizations.total,
  );
  const organizationExport = useOrganizationExport({
    filters: filters.filters,
    page: filters.page,
    pageSize: filters.pageSize,
    selectedRowIds: selection.selectedRowIds,
  });
  const actions = useOrganizationActions({
    deleteOrganization: organizations.deleteOrganization,
    isDeleting: organizations.isDeleting,
    isUpdating: organizations.isUpdating,
    refetch: organizations.refetch,
    removeSelectedOrganizations: selection.removeSelectedOrganizations,
    setSelectedOrganization: selection.setSelectedOrganization,
    updateOrganization: organizations.updateOrganization,
  });
  const form = useOrganizationForm({
    createOrganization: organizations.createOrganization,
    isCreating: organizations.isCreating,
    isUpdating: organizations.isUpdating,
    refetch: organizations.refetch,
    setSelectedOrganization: selection.setSelectedOrganization,
    showToast: actions.showToast,
    updateOrganization: organizations.updateOrganization,
  });
  const rowActions = useMemo(
    () => actions.createRowActionHandlers(form.openEditOrganization),
    [actions.createRowActionHandlers, form.openEditOrganization],
  );

  return {
    actions,
    filteredRows,
    filters,
    form,
    isSidePanelOpen,
    organizationExport,
    organizations,
    rowActions,
    selection,
    statistics,
  };
}
