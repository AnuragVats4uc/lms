"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { organizationsApi, sessionsApi } from "@repo/api";
import { useAuthSession } from "@repo/auth";

export function useAcademicSessions() {
  const { currentUser } = useAuthSession();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const organizationQuery = useQueryOrganizations(currentUser?.organizationId);
  const organizationId = currentUser?.organizationId ?? selectedOrganizationId ?? organizationQuery.organizations[0]?.id ?? null;
  const sessionsQuery = useSessionsForOrganization(organizationId);
  const sessions = sessionsQuery.sessions;

  const effectiveSessionId = useMemo(
    () => selectedSessionId ?? sessions[0]?.id ?? null,
    [selectedSessionId, sessions],
  );

  return {
    isLoading: organizationQuery.isLoading || sessionsQuery.isLoading,
    organizations: organizationQuery.organizations,
    selectedOrganizationId: organizationId,
    selectedSessionId: effectiveSessionId,
    setSelectedOrganizationId,
    sessions,
    setSelectedSessionId,
  };
}

function useQueryOrganizations(organizationId: number | null | undefined) {
  const { data, isLoading } = useAcademicQuery(
    organizationId == null,
    () => organizationsApi.findAll({ limit: 100, page: 1 }),
    ["admin", "academic-organizations"],
  );
  return { isLoading, organizations: data?.items ?? [] };
}

function useSessionsForOrganization(organizationId: number | null) {
  const { data, isLoading } = useAcademicQuery(
    organizationId !== null,
    () => sessionsApi.findAll(organizationId as number, { limit: 100, page: 1 }),
    ["admin", "academic-sessions", organizationId],
  );
  return { isLoading, sessions: data?.items ?? [] };
}

function useAcademicQuery<T>(
  enabled: boolean,
  queryFn: () => Promise<T>,
  queryKey: readonly unknown[],
) {
  // This wrapper keeps the two dependent lookups consistent with the existing
  // TanStack Query usage while keeping the hook's public result small.
  return useQuery({ enabled, queryFn, queryKey, staleTime: 60_000 });
}
