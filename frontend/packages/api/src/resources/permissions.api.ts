import type {
  ApiResponse,
  CreatePermissionRequest,
  Permission,
  PermissionList,
  PermissionQuery,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const PERMISSIONS_ENDPOINT = "/permissions";

export const permissionsApi = {
  create(payload: CreatePermissionRequest) {
    return api
      .post<ApiResponse<Permission>>(
        PERMISSIONS_ENDPOINT,
        payload
      )
      .then(unwrapApiData);
  },

  findAll(query?: PermissionQuery) {
    return api
      .get<ApiResponse<PermissionList>>(
        PERMISSIONS_ENDPOINT,
        { params: query }
      )
      .then(unwrapApiData);
  },

  findOne(id: number) {
    return api
      .get<ApiResponse<Permission>>(
        `${PERMISSIONS_ENDPOINT}/${id}`
      )
      .then(unwrapApiData);
  },
};
