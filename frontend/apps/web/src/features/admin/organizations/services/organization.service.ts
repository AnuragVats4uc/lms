import { organizationsApi } from "@repo/api";

export type OrganizationListStatus = "ACTIVE" | "INACTIVE" | undefined;

export interface OrganizationListParams {
  limit: number;
  page: number;
  search?: string;
  status?: OrganizationListStatus;
}

export const getOrganizations = (params: OrganizationListParams) => {
  return organizationsApi.findAll(params);
};
