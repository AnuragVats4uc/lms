import { organizationsApi } from "@repo/api";
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "@repo/types";

export type OrganizationListStatus = "ACTIVE" | "INACTIVE" | undefined;

export interface OrganizationListParams {
  limit: number;
  page: number;
  search?: string;
  status?: OrganizationListStatus;
}

export interface UpdateOrganizationInput {
  id: number;
  payload: UpdateOrganizationRequest;
}

export const getOrganizations = (params: OrganizationListParams) => {
  return organizationsApi.findAll(params);
};

export const createOrganization = (payload: CreateOrganizationRequest) => {
  return organizationsApi.create(payload);
};

export const updateOrganization = ({
  id,
  payload,
}: UpdateOrganizationInput) => {
  return organizationsApi.update(id, payload);
};

export const deleteOrganization = (id: number) => {
  return organizationsApi.remove(id);
};
