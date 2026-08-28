import { api, ApiResponse } from "@repo/api";

import {
  AuthUser,
  LoginData,
  LoginDto,
  TokenPair,
} from "../types/auth.types";

import { AUTH_ENDPOINTS } from "./endpoints";

export const authApi = {
  login: (payload: LoginDto) =>
    api
      .post<ApiResponse<LoginData>>(
        AUTH_ENDPOINTS.LOGIN,
        payload
      )
      .then((res) => normalizeLoginData(res.data.data)),

  refresh: (refreshToken: string) =>
    api
      .post<ApiResponse<TokenPair>>(
        AUTH_ENDPOINTS.REFRESH,
        { refreshToken }
      )
      .then((res) => ({
        ...res.data.data,
        user: res.data.data.user
          ? normalizeAuthUser(res.data.data.user)
          : undefined,
      })),

  logout: (refreshToken: string) =>
    api
      .post(AUTH_ENDPOINTS.LOGOUT, { refreshToken })
      .then((res) => res.data),
};

function normalizeLoginData(data: LoginData): LoginData {
  const user = normalizeAuthUser(data.user);

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    activitySessionUuid: data.activitySessionUuid,
    user,
  };
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  const roles = user.roles ?? (user.role ? [user.role] : []);

  return {
    ...user,
    role: user.role ?? roles[0] ?? null,
    roles,
    permissions: user.permissions ?? [],
  };
}
