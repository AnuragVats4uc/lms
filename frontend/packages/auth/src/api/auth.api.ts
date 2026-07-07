import { api, ApiResponse } from "@repo/api";

import {
  LoginData,
  LoginDto,
  Student,
} from "../types/auth.types";

import { AUTH_ENDPOINTS } from "./endpoints";

export const authApi = {
  login: (payload: LoginDto) =>
    api
      .post<ApiResponse<LoginData>>(AUTH_ENDPOINTS.LOGIN, payload)
      .then((res) => res.data.data),

  me: () =>
    api
      .get<Student>(AUTH_ENDPOINTS.ME)
      .then((res) => res.data),

  refresh: (refreshToken: string) =>
    api
      .post(AUTH_ENDPOINTS.REFRESH, { refreshToken })
      .then((res) => res.data),

  logout: () =>
    api
      .post(AUTH_ENDPOINTS.LOGOUT)
      .then((res) => res.data),
};