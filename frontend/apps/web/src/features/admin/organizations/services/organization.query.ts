import type { OrganizationListParams } from "./organization.service";

export const ORGANIZATION_QUERY_STALE_TIME = 30_000;

export const organizationQueryKeys = {
  all: ["admin", "organizations"] as const,
  detail: (organizationId: number) =>
    [...organizationQueryKeys.details(), organizationId] as const,
  details: () => [...organizationQueryKeys.all, "detail"] as const,
  list: (params: OrganizationListParams) =>
    [
      ...organizationQueryKeys.all,
      params.page,
      params.limit,
      params.search ?? "",
      params.status,
    ] as const,
  lists: () => organizationQueryKeys.all,
};
