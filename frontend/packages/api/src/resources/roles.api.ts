import type {
  ApiResponse,
  AssignRolePermissionsRequest,
  AssignUserRoleRequest,
  CreateRoleRequest,
  Role,
  RoleList,
  RoleQuery,
  UpdateRoleRequest,
  UserRole,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const ROLES_ENDPOINT = "/roles";

export const rolesApi = {
  create(payload: CreateRoleRequest) {
    return api
      .post<ApiResponse<Role>>(ROLES_ENDPOINT, payload)
      .then(unwrapApiData);
  },

  findAll(query?: RoleQuery) {
    return api
      .get<ApiResponse<RoleList>>(ROLES_ENDPOINT, {
        params: query,
      })
      .then(unwrapApiData);
  },

  findOne(id: number) {
    return api
      .get<ApiResponse<Role>>(`${ROLES_ENDPOINT}/${id}`)
      .then(unwrapApiData);
  },

  update(id: number, payload: UpdateRoleRequest) {
    return api
      .patch<ApiResponse<Role>>(
        `${ROLES_ENDPOINT}/${id}`,
        payload
      )
      .then(unwrapApiData);
  },

  assignPermissions(
    id: number,
    payload: AssignRolePermissionsRequest
  ) {
    return api
      .post<ApiResponse<Role>>(
        `${ROLES_ENDPOINT}/${id}/permissions`,
        payload
      )
      .then(unwrapApiData);
  },

  assignToUser(
    id: number,
    payload: AssignUserRoleRequest
  ) {
    return api
      .post<ApiResponse<UserRole>>(
        `${ROLES_ENDPOINT}/${id}/users`,
        payload
      )
      .then(unwrapApiData);
  },
};
