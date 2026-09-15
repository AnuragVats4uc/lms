import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@repo/api";
import type { DashboardQuery } from "@repo/types";

import { DASHBOARD_QUERY_KEY } from "../constants";

export const useAdminDashboard = (context: DashboardQuery) => {
  const dashboardQuery = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY],
    queryFn: () => dashboardApi.findSummary(),
  });
  const effectiveContext = useMemo(() => {
    const next = { ...context };
    const data = dashboardQuery.data;
    if (next.organizationId === undefined && data?.context.organization) {
      next.organizationId = data.context.organization.id;
    }
    if (next.sessionId === undefined && data?.context.session) {
      next.sessionId = data.context.session.id;
    }
    if (next.sessionCourseId === undefined && data?.context.sessionCourseId) {
      next.sessionCourseId = data.context.sessionCourseId;
    }
    return next;
  }, [context, dashboardQuery.data]);
  const contextReady = Boolean(
    dashboardQuery.data && Object.keys(effectiveContext).length,
  );
  const resourceQuery = useQuery({
    enabled: contextReady,
    queryKey: [
      DASHBOARD_QUERY_KEY,
      "resources",
      effectiveContext.organizationId ?? null,
      effectiveContext.sessionId ?? null,
      effectiveContext.sessionCourseId ?? null,
      effectiveContext.folderId ?? null,
    ],
    queryFn: () => dashboardApi.findSummary(effectiveContext),
  });
  const contextOptionsQuery = useQuery({
    enabled: Boolean(dashboardQuery.data),
    queryKey: [
      DASHBOARD_QUERY_KEY,
      "contexts",
      effectiveContext.organizationId ?? null,
      effectiveContext.sessionId ?? null,
      effectiveContext.sessionCourseId ?? null,
      effectiveContext.folderId ?? null,
    ],
    queryFn: () => dashboardApi.findContextOptions(effectiveContext),
  });

  return {
    contextOptionsQuery,
    dashboardQuery,
    effectiveContext,
    resourceQuery,
  };
};
