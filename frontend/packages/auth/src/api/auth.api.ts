import { api, ApiResponse } from "@repo/api";

import {
  LoginData,
  LoginDto,
  Student,
  TokenPair,
} from "../types/auth.types";

import { AUTH_ENDPOINTS } from "./endpoints";

export const authApi = {
  login: (payload: LoginDto) =>
    api
      .post<ApiResponse<LoginData>>(AUTH_ENDPOINTS.LOGIN, payload)
      .then((res) => res.data.data),

  me: () =>
    api
      .get<ApiResponse<Student>>(AUTH_ENDPOINTS.ME)
      .then((res) => res.data.data),

  refresh: (refreshToken: string) =>
    api
      .post<ApiResponse<TokenPair>>(
        AUTH_ENDPOINTS.REFRESH,
        { refreshToken }
      )
      .then((res) => res.data.data),

  logout: (refreshToken: string) =>
    api
      .post(AUTH_ENDPOINTS.LOGOUT, { refreshToken })
      .then((res) => res.data),
};
