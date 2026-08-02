import type { SessionListParams } from "./session.service";

export const SESSION_QUERY_STALE_TIME = 30_000;

export const sessionQueryKeys = {
  all: ["admin", "sessions"] as const,
  detail: (organizationId: number, sessionId: number) =>
    [...sessionQueryKeys.details(organizationId), sessionId] as const,
  details: (organizationId: number) =>
    [...sessionQueryKeys.all, "detail", organizationId] as const,
  list: (organizationId: number, params: SessionListParams) =>
    [
      ...sessionQueryKeys.all,
      organizationId,
      params.page,
      params.limit,
      params.search ?? "",
      params.status ?? "",
      params.sort ?? "createdAt",
      params.order ?? "desc",
    ] as const,
};
