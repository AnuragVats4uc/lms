import type { SessionCourseStatus } from "@repo/types";
export const getSessionCourseStatusTone = (status: SessionCourseStatus) =>
  status === "ACTIVE"
    ? ("success" as const)
    : status === "INACTIVE"
      ? ("danger" as const)
      : status === "ARCHIVED"
        ? ("neutral" as const)
        : ("warning" as const);
