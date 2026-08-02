"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { XStack, YStack } from "@repo/ui";

import { BulkActionBar } from "../components/bulk-actions";
import { ActiveFilterChips, OrganizationToolbar } from "../components/filters";
import { OrganizationHeader } from "../components/header";
import { OrganizationSidePanel } from "../components/side-panel";
import { OrganizationOverlays } from "../components/shared";
import { OrganizationStats } from "../components/stats";
import { useOrganizationsPage } from "../hooks";
import { OrganizationStoreProvider } from "../store";
import { OrganizationTable } from "../table";
import { getFiltersFromParams, parseInteger } from "../utils";
import "../styles/organizations.css";

export const OrganizationsPage = () => {
  const searchParams = useSearchParams();
  const [initialStoreState] = useState(() => {
    const params = new URLSearchParams(searchParams.toString());

    return {
      filters: getFiltersFromParams(params),
      page: parseInteger(params.get("page"), 1),
      pageSize: parseInteger(params.get("limit"), 10),
    };
  });

  return (
    <OrganizationStoreProvider initialState={initialStoreState}>
      <OrganizationsPageContent />
    </OrganizationStoreProvider>
  );
};

const OrganizationsPageContent = () => {
  const page = useOrganizationsPage();

  return (
    <YStack className="lms-organizations-page" gap="$5" width="100%">
      <OrganizationHeader
        isFetching={page.organizations.isFetching}
        onAdd={page.form.openAddOrganization}
        onExport={page.organizationExport.exportOrganizations}
        onRefresh={() => page.organizations.refetch()}
      />

      <OrganizationStats
        activeCount={page.statistics.activeCount}
        inactiveCount={page.statistics.inactiveCount}
        isLoading={page.organizations.isLoading}
        newlyCreatedCount={page.statistics.newlyCreatedCount}
        total={page.statistics.total}
      />

      <OrganizationToolbar
        filters={page.filters.filters}
        onClearFilters={page.filters.clearFilters}
        onExport={page.organizationExport.exportOrganizations}
        onFilterChange={page.filters.updateFilters}
        onRefresh={() => page.organizations.refetch()}
      />

      <OrganizationOverlays actions={page.actions} form={page.form} />

      <ActiveFilterChips
        filters={page.filters.activeChips}
        onClear={page.filters.clearFilters}
        onRemove={page.filters.removeFilter}
      />

      <XStack
        className={[
          "lms-organization-management-grid",
          page.isSidePanelOpen ? "is-side-panel-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        gap="$4"
        width="100%"
        style={{ alignItems: "flex-start" }}
      >
        <YStack gap="$3" flex={1} minW={0}>
          <BulkActionBar
            count={page.selection.selectedRowIds.length}
            onClear={page.selection.clearSelection}
            onDelete={() =>
              page.actions.openBulkDelete(page.selection.selectedOrganizations)
            }
            onExport={page.organizationExport.exportSelectedOrganizations}
            onSetActive={(active) =>
              page.actions.openBulkStatus(
                page.selection.selectedOrganizations,
                active,
              )
            }
          />

          <OrganizationTable
            actions={page.rowActions}
            data={page.filteredRows}
            error={page.organizations.error}
            hasFilters={page.filters.hasFilters}
            hasSearch={Boolean(page.filters.filters.search)}
            isError={page.organizations.isError}
            loading={page.organizations.isLoading}
            onAddOrganization={page.form.openAddOrganization}
            onPageChange={page.filters.setPage}
            onPageSizeChange={page.filters.handlePageSizeChange}
            onRetry={() => page.organizations.refetch()}
            onRowClick={page.selection.setSelectedOrganization}
            onSelectionChange={page.selection.handleSelectionChange}
            pagination={{
              page: page.filters.page,
              pageSize: page.filters.pageSize,
              total: page.organizations.total,
              totalPages: page.organizations.meta?.totalPages ?? 1,
            }}
            selectedRowIds={page.selection.selectedRowIds}
          />
        </YStack>

        <OrganizationSidePanel
          isLoading={
            page.organizations.isLoading &&
            Boolean(page.selection.selectedRowIds.length)
          }
          organization={
            page.isSidePanelOpen ? page.selection.selectedOrganization : null
          }
        />
      </XStack>
    </YStack>
  );
};

export default OrganizationsPage;
