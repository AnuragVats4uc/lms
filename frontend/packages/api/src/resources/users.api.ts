import type {
  ApiResponse,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserList,
  UserQuery,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const USERS_ENDPOINT = "/users";

export const usersApi = {
  create(payload: CreateUserRequest) {
    return api
      .post<ApiResponse<User>>(USERS_ENDPOINT, payload)
      .then(unwrapApiData);
  },

  findAll(query?: UserQuery) {
    return api
      .get<ApiResponse<UserList>>(USERS_ENDPOINT, { params: query })
      .then(unwrapApiData);
  },

  findOne(id: number) {
    return api
      .get<ApiResponse<User>>(`${USERS_ENDPOINT}/${id}`)
      .then(unwrapApiData);
  },

  update(id: number, payload: UpdateUserRequest) {
    return api
      .patch<ApiResponse<User>>(`${USERS_ENDPOINT}/${id}`, payload)
      .then(unwrapApiData);
  },

  remove(id: number) {
    return api
      .delete<ApiResponse<User>>(`${USERS_ENDPOINT}/${id}`)
      .then(unwrapApiData);
  },
};
