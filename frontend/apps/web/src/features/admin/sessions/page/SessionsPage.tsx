"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Text, XStack, YStack } from "@repo/ui";
import { DataTableSort } from "@/components/DataTable";

import { SessionFilterChips, SessionHeader, SessionOverlays, SessionSidePanel, SessionStats, SessionTable, SessionToolbar } from "../components";
import { useSessionsPage } from "../hooks";
import { DEFAULT_SESSION_FILTERS, SessionStoreProvider } from "../store";
import type { SessionFiltersState } from "../types";

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFilters(params: URLSearchParams): SessionFiltersState {
  const sort = params.get("sort");
  const status = params.get("status");
  return {
    ...DEFAULT_SESSION_FILTERS,
    organizationId: params.get("organizationId") ? parseNumber(params.get("organizationId"), 0) : null,
    search: params.get("search") ?? "",
    status: status === "UPCOMING" || status === "ACTIVE" || status === "COMPLETED" || status === "ARCHIVED" ? status : "ALL",
    sort: sort === "name" || sort === "startDate" || sort === "endDate" || sort === "updatedAt" ? sort : "createdAt",
    order: params.get("order") === "asc" ? "asc" : "desc",
  };
}

export function SessionsPage() {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => {
    const params = new URLSearchParams(searchParams.toString());
    return { filters: parseFilters(params), page: parseNumber(params.get("page"), 1), pageSize: parseNumber(params.get("limit"), 10) };
  });
  return <SessionStoreProvider initialState={initialState}><SessionsPageContent /></SessionStoreProvider>;
}

function SessionsPageContent() {
  const searchParams = useSearchParams();
  const handledCreateAction = useRef(false);
  const page = useSessionsPage();
  useEffect(() => {
    if (
      searchParams.get("action") === "create" &&
      page.canCreate &&
      page.organizationId !== null &&
      !handledCreateAction.current
    ) {
      page.form.openAddSession();
      handledCreateAction.current = true;
    }
  }, [page.canCreate, page.form, page.organizationId, searchParams]);
  const sorting: DataTableSort[] = [{ id: page.filters.filters.sort, direction: page.filters.filters.order }];
  const hasOrganization = page.organizationId !== null;
  return <YStack className="lms-organizations-page" gap="$5" style={{ width: "100%" }}>
    <SessionHeader canCreate={page.canCreate} hasOrganization={hasOrganization} isFetching={page.sessionQuery.isFetching} onAdd={page.form.openAddSession} onRefresh={() => page.sessionQuery.refetch()} />
    <SessionStats isLoading={page.sessionQuery.isLoading} rows={page.sessionQuery.rows} total={page.sessionQuery.total} />
    <SessionToolbar filters={page.filters.filters} onClear={page.filters.clearFilters} onOrganizationChange={(organizationId) => page.filters.updateFilters({ ...page.filters.filters, organizationId })} onRefresh={() => page.sessionQuery.refetch()} onSearch={(search) => page.filters.updateFilters({ ...page.filters.filters, search })} onSort={page.filters.updateSort} onStatus={page.filters.updateStatus} organizations={page.organizations} />
    <SessionOverlays actions={page.actions} form={page.form} />
    <SessionFilterChips chips={page.filters.activeChips} onClear={page.filters.clearFilters} onRemove={page.filters.removeFilter} />
    {!hasOrganization && !page.isOrganizationLoading ? <YStack gap="$2" p="$4" style={{ backgroundColor: "#FFF7ED", borderColor: "#FED7AA", borderRadius: 12, borderWidth: 1 }}><Text color="#9A3412" fontSize="$label" fontWeight="$button">Select an organization</Text><Text color="#9A3412" fontSize="$caption">Sessions are scoped to an organization. Choose one above to load its session records.</Text></YStack> : null}
    <XStack className={["lms-organization-management-grid", page.store.isSidePanelOpen ? "is-side-panel-open" : ""].filter(Boolean).join(" ")} gap="$4" style={{ alignItems: "flex-start", width: "100%" }}>
      <YStack gap="$3" style={{ flex: 1, minWidth: 0 }}>
        {page.selectedSessions.length && page.canDelete ? <XStack className="lms-organization-bulk-bar" gap="$3" p="$3" style={{ alignItems: "center", backgroundColor: "#ECFDF5", borderColor: "#B7E4CB", borderRadius: 12, borderWidth: 1 }}><Text color="#047857" fontSize="$caption" fontWeight="$button">{page.selectedSessions.length} selected</Text><Button background="#DC2626" borderColor="#DC2626" borderWidth={1} height={34} onPress={page.actions.openBulkDelete} rounded="$3"><Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">Delete selected</Button.Text></Button><Button background="transparent" chromeless height={34} onPress={() => page.store.setSelectedRowIds([])}><Button.Text color="#047857" fontSize="$caption" fontWeight="$button">Clear</Button.Text></Button></XStack> : null}
        <SessionTable actions={page.rowActions} data={page.sessionQuery.rows} error={page.sessionQuery.error} hasFilters={page.filters.hasFilters} loading={page.sessionQuery.isLoading} onPageChange={page.filters.setPage} onPageSizeChange={page.filters.handlePageSizeChange} onRetry={() => page.sessionQuery.refetch()} onRowClick={page.store.setSelectedSession} onSelectionChange={page.store.setSelectedRowIds} onSort={(next) => { const current = next[0]; if (current) page.filters.updateSort(current.id as SessionFiltersState["sort"], current.direction); }} pagination={{ page: page.filters.page, pageSize: page.filters.pageSize, total: page.sessionQuery.total, totalPages: page.sessionQuery.meta?.totalPages ?? 1 }} selectedRowIds={page.store.selectedRowIds} sorting={sorting} />
      </YStack>
      <SessionSidePanel isLoading={page.sessionQuery.isLoading && Boolean(page.store.selectedRowIds.length)} session={page.store.isSidePanelOpen ? page.store.selectedSession : null} />
    </XStack>
  </YStack>;
}

export default SessionsPage;
