"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";

import { DataTable, type DataTableRowId } from "@/components/DataTable";

import { OrganizationHeaderAction } from "../components/header";
import { PAGE_SIZE_OPTIONS } from "../constants";
import type {
  OrganizationRowActionHandlers,
  OrganizationTableRow,
} from "../types";
import { createOrganizationColumns } from "./columns";

interface OrganizationTablePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface OrganizationTableProps {
  actions: OrganizationRowActionHandlers;
  data: OrganizationTableRow[];
  error: unknown;
  hasFilters: boolean;
  hasSearch: boolean;
  isError: boolean;
  loading: boolean;
  onAddOrganization: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRetry: () => void;
  onRowClick: (organization: OrganizationTableRow) => void;
  onSelectionChange: (
    ids: DataTableRowId[],
    selectedRows: OrganizationTableRow[],
  ) => void;
  pagination: OrganizationTablePagination;
  selectedRowIds: DataTableRowId[];
}

export const OrganizationTable = ({
  actions,
  data,
  error,
  hasFilters,
  hasSearch,
  isError,
  loading,
  onAddOrganization,
  onPageChange,
  onPageSizeChange,
  onRetry,
  onRowClick,
  onSelectionChange,
  pagination,
  selectedRowIds,
}: OrganizationTableProps) => {
  const columns = useMemo(() => createOrganizationColumns(actions), [actions]);
  const hasActiveCriteria = hasSearch || hasFilters;

  return (
    <DataTable<OrganizationTableRow>
      columns={columns}
      data={data}
      emptyState={{
        description: hasActiveCriteria
          ? "No organizations match the current search or filter criteria."
          : "Create your first tenant organization to start managing LMS data.",
        primaryAction: (
          <OrganizationHeaderAction
            icon={<Plus aria-hidden="true" color="#FFFFFF" size={16} />}
            onPress={onAddOrganization}
            primary
          >
            Add Organization
          </OrganizationHeaderAction>
        ),
        title: hasActiveCriteria
          ? "No matching organizations"
          : "No organizations found",
      }}
      error={
        isError
          ? {
              description:
                error instanceof Error
                  ? error.message
                  : "The organization list could not be loaded.",
              onRetry,
              retryLabel: "Retry",
              title: "Unable to load organizations",
            }
          : null
      }
      getRowId={(organization) => organization.id}
      loading={loading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onRowClick}
      onSelectionChange={onSelectionChange}
      pagination={{
        entityLabel: "organizations",
        mode: "server",
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }}
      renderToolbar={() => null}
      searchable={false}
      selectable
      selectedRowIds={selectedRowIds}
      stickyFirstColumn
      stickyHeader
    />
  );
};
