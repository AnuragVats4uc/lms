"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateSessionRequest,
  SessionQuery,
  UpdateSessionRequest,
} from "@repo/types";

import {
  createSession,
  deleteSession,
  getSessions,
  SESSION_QUERY_STALE_TIME,
  sessionQueryKeys,
  updateSession,
  type SessionListParams,
} from "../services";

export function useSessions({
  filters,
  organizationId,
  page,
  pageSize,
}: {
  filters: SessionQuery;
  organizationId: number | null;
  page: number;
  pageSize: number;
}) {
  const queryClient = useQueryClient();
  const params: SessionListParams = {
    limit: pageSize,
    page,
    order: filters.order,
    search: filters.search || undefined,
    sort: filters.sort,
    status: filters.status,
  };
  const query = useQuery({
    enabled: organizationId !== null,
    queryFn: () => getSessions(organizationId as number, params),
    queryKey:
      organizationId === null
        ? ["admin", "sessions", "no-organization"]
        : sessionQueryKeys.list(organizationId, params),
    staleTime: SESSION_QUERY_STALE_TIME,
  });
  const createMutation = useMutation({
    mutationFn: (payload: CreateSessionRequest) =>
      createSession(organizationId as number, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: (input: { sessionId: number; payload: UpdateSessionRequest }) =>
      updateSession({ ...input, organizationId: organizationId as number }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (sessionId: number) =>
      deleteSession(organizationId as number, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  const rows = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  return {
    createSession: createMutation.mutateAsync,
    deleteSession: deleteMutation.mutateAsync,
    error: query.error,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    isUpdating: updateMutation.isPending,
    meta: query.data?.meta,
    refetch: query.refetch,
    rows,
    total: query.data?.meta.total ?? 0,
    updateSession: updateMutation.mutateAsync,
  };
}
