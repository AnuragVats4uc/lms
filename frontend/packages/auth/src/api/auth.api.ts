import { api, ApiResponse } from "@repo/api";

import {
  LoginData,
  LoginDto,
  CurrentImpersonationData,
  RegisterData,
  RegisterDto,
  Student,
  StartStudentImpersonationData,
  StartStudentImpersonationDto,
  StopImpersonationData,
  TokenPair,
} from "../types/auth.types";

import { AUTH_ENDPOINTS } from "./endpoints";

export const authApi = {
  login: (payload: LoginDto) =>
    api
      .post<ApiResponse<LoginData>>(AUTH_ENDPOINTS.LOGIN, payload)
      .then((res) => res.data.data),

  register: (payload: RegisterDto) =>
    api
      .post<ApiResponse<RegisterData>>(
        AUTH_ENDPOINTS.REGISTER,
        payload
      )
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

  startStudentImpersonation: (
    studentId: string,
    payload: StartStudentImpersonationDto = {}
  ) =>
    api
      .post<ApiResponse<StartStudentImpersonationData>>(
        AUTH_ENDPOINTS.START_STUDENT_IMPERSONATION(
          studentId
        ),
        payload
      )
      .then((res) => res.data.data),

  stopImpersonation: () =>
    api
      .post<ApiResponse<StopImpersonationData>>(
        AUTH_ENDPOINTS.STOP_IMPERSONATION
      )
      .then((res) => res.data.data),

  currentImpersonation: () =>
    api
      .get<ApiResponse<CurrentImpersonationData>>(
        AUTH_ENDPOINTS.CURRENT_IMPERSONATION
      )
      .then((res) => res.data.data),
};
