import type { AuthUser } from "@repo/auth";

export const LOGIN_PATH = "/login";
export const UNAUTHORIZED_PATH = "/unauthorized";
export const ADMIN_HOME_PATH = "/admin/dashboard";
export const STUDENT_HOME_PATH = "/student/dashboard";

export function getAuthenticatedPath(user: AuthUser | null) {
  if (!user) {
    return ADMIN_HOME_PATH;
  }

  if (
    user.roles.includes("SUPER_ADMIN") ||
    user.roles.includes("ADMIN")
  ) {
    return ADMIN_HOME_PATH;
  }

  if (user.roles.includes("STUDENT")) {
    return STUDENT_HOME_PATH;
  }

  return UNAUTHORIZED_PATH;
}
