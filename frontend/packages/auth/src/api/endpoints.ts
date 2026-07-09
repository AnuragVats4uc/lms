export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",

  REGISTER: "/auth/register",

  ME: "/students/me",

  REFRESH: "/auth/refresh",

  LOGOUT: "/auth/logout",

  START_STUDENT_IMPERSONATION: (studentId: string) =>
    `/admin/students/${studentId}/impersonate`,

  STOP_IMPERSONATION: "/admin/impersonation/stop",

  CURRENT_IMPERSONATION: "/admin/impersonation/current",
} as const;
