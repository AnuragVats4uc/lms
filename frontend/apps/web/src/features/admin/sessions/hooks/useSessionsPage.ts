"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@repo/api";
import { useAuthSession } from "@repo/auth";
import { userHasPermission } from "@/features/shared/access";

import { useSessionStore } from "../store";
import { useSessionActions } from "./useSessionActions";
import { useSessionFilters } from "./useSessionFilters";
import { useSessionForm } from "./useSessionForm";
import { useSessions } from "./useSessions";

export function useSessionsPage() {
  const auth = useAuthSession();
  const store = useSessionStore();
  const filters = useSessionFilters();
  const canCreate = userHasPermission(auth.currentUser, "session.create");
  const canUpdate = userHasPermission(auth.currentUser, "session.update");
  const canDelete = userHasPermission(auth.currentUser, "session.delete");
  const organizationQuery = useQuery({
    enabled: auth.currentUser?.organizationId == null,
    queryFn: () => organizationsApi.findAll({ limit: 100, page: 1 }),
    queryKey: ["admin", "session-organizations"],
    staleTime: 60_000,
  });
  const organizations = useMemo(
    () => organizationQuery.data?.items ?? [],
    [organizationQuery.data?.items],
  );
  const organizationId =
    auth.currentUser?.organizationId ?? filters.filters.organizationId;

  useEffect(() => {
    if (auth.currentUser?.organizationId !== null && auth.currentUser?.organizationId !== undefined) {
      if (filters.filters.organizationId !== auth.currentUser.organizationId) {
        filters.updateFilters({ ...filters.filters, organizationId: auth.currentUser.organizationId });
      }
      return;
    }
    if (filters.filters.organizationId === null && organizations[0]) {
      filters.updateFilters({ ...filters.filters, organizationId: organizations[0].id });
    }
  }, [auth.currentUser?.organizationId, filters, organizations]);

  const sessionQuery = useSessions({
    filters: {
      order: filters.filters.order,
      search: filters.debouncedSearch,
      sort: filters.filters.sort,
      status: filters.filters.status === "ALL" ? undefined : filters.filters.status,
    },
    organizationId,
    page: store.page,
    pageSize: store.pageSize,
  });
  const selectedSessions = useMemo(
    () => sessionQuery.rows.filter((session) => store.selectedRowIds.includes(session.id)),
    [sessionQuery.rows, store.selectedRowIds],
  );
  const actions = useSessionActions({
    canDelete,
    canUpdate,
    deleteSession: sessionQuery.deleteSession,
    isDeleting: sessionQuery.isDeleting,
    isUpdating: sessionQuery.isUpdating,
    refetch: sessionQuery.refetch,
    selectedSessions,
    setSelectedRowIds: store.setSelectedRowIds,
    showSelected: store.setSelectedSession,
    updateSession: sessionQuery.updateSession,
  });
  const form = useSessionForm({
    createSession: sessionQuery.createSession,
    isCreating: sessionQuery.isCreating,
    isUpdating: sessionQuery.isUpdating,
    refetch: sessionQuery.refetch,
    showToast: actions.showToast,
    updateSession: sessionQuery.updateSession,
  });
  const rowActions = {
    ...actions.rowActions,
    onEdit: canUpdate ? form.openEditSession : undefined,
  };

  return {
    actions,
    auth,
    canCreate,
    canDelete,
    canUpdate,
    filters,
    form,
    isOrganizationLoading: organizationQuery.isLoading,
    organizations,
    organizationId,
    rowActions,
    selectedSessions,
    sessionQuery,
    store,
  };
}
