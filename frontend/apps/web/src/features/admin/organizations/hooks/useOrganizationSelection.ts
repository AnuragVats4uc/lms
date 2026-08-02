"use client";

import { useCallback, useEffect, useMemo } from "react";

import { useOrganizationStore } from "../store";
import type { DataTableRowId } from "../table";
import type { OrganizationTableRow } from "../types";

interface UseOrganizationSelectionOptions {
  rows: OrganizationTableRow[];
  visibleRows: OrganizationTableRow[];
}

export const useOrganizationSelection = ({
  rows,
  visibleRows,
}: UseOrganizationSelectionOptions) => {
  const {
    selectedOrganization,
    selectedRowIds,
    setSelectedOrganization,
    setSelectedRowIds,
  } = useOrganizationStore();

  useEffect(() => {
    if (!selectedOrganization) {
      return;
    }

    const nextSelected = rows.find((row) => row.id === selectedOrganization.id);

    if (nextSelected) {
      queueMicrotask(() => setSelectedOrganization(nextSelected));
    }
  }, [rows, selectedOrganization, setSelectedOrganization]);

  const selectedOrganizations = useMemo(
    () => visibleRows.filter((row) => selectedRowIds.includes(row.id)),
    [selectedRowIds, visibleRows],
  );

  const clearSelection = useCallback(() => {
    setSelectedRowIds([]);
  }, [setSelectedRowIds]);

  const handleSelectionChange = useCallback(
    (ids: DataTableRowId[], selectedRows: OrganizationTableRow[]) => {
      setSelectedRowIds(ids);
      setSelectedOrganization(selectedRows[0] ?? null);
    },
    [setSelectedOrganization, setSelectedRowIds],
  );

  const removeSelectedOrganizations = useCallback(
    (organizationIds: number[]) => {
      const ids = new Set(organizationIds);

      setSelectedRowIds((current) =>
        current.filter((id) => !ids.has(Number(id))),
      );
      setSelectedOrganization((current) =>
        current && ids.has(current.id) ? null : current,
      );
    },
    [setSelectedOrganization, setSelectedRowIds],
  );

  const toggle = useCallback(
    (id: DataTableRowId) => {
      setSelectedRowIds((current) =>
        current.includes(id)
          ? current.filter((currentId) => currentId !== id)
          : [...current, id],
      );
    },
    [setSelectedRowIds],
  );

  const selectAll = useCallback(() => {
    setSelectedRowIds(visibleRows.map((row) => row.id));
  }, [setSelectedRowIds, visibleRows]);

  return {
    clearSelection,
    handleSelectionChange,
    removeSelectedOrganizations,
    selectAll,
    selectedOrganization,
    selectedOrganizations,
    selectedRowIds,
    setSelectedOrganization,
    toggle,
  };
};
