import type { AuthUser } from "@repo/auth";

export function userHasPermission(
  user: AuthUser | null,
  permission: string
) {
  if (!user) {
    return false;
  }

  return (
    user.roles.includes("SUPER_ADMIN") ||
    user.permissions.includes(permission)
  );
}

export function getUserDisplayName(user: AuthUser | null) {
  if (!user) {
    return "";
  }

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.email;
}
