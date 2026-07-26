import type {
  ApiResponse,
  CreateOrganizationRequest,
  Organization,
  OrganizationList,
  OrganizationQuery,
  UpdateOrganizationRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const ORGANIZATIONS_ENDPOINT = "/organizations";

export const organizationsApi = {
  create(payload: CreateOrganizationRequest) {
    return api
      .post<ApiResponse<Organization>>(
        ORGANIZATIONS_ENDPOINT,
        payload
      )
      .then(unwrapApiData);
  },

  findAll(query?: OrganizationQuery) {
    return api
      .get<ApiResponse<OrganizationList>>(
        ORGANIZATIONS_ENDPOINT,
        { params: query }
      )
      .then(unwrapApiData);
  },

  findOne(id: number) {
    return api
      .get<ApiResponse<Organization>>(
        `${ORGANIZATIONS_ENDPOINT}/${id}`
      )
      .then(unwrapApiData);
  },

  update(id: number, payload: UpdateOrganizationRequest) {
    return api
      .patch<ApiResponse<Organization>>(
        `${ORGANIZATIONS_ENDPOINT}/${id}`,
        payload
      )
      .then(unwrapApiData);
  },

  remove(id: number) {
    return api
      .delete<ApiResponse<Organization>>(
        `${ORGANIZATIONS_ENDPOINT}/${id}`
      )
      .then(unwrapApiData);
  },
};
