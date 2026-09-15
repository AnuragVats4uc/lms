import type { CourseStatus } from "@repo/types";

export const getCourseStatusTone = (status: CourseStatus) =>
  status === "ACTIVE"
    ? ("success" as const)
    : status === "INACTIVE"
      ? ("danger" as const)
      : status === "ARCHIVED"
        ? ("neutral" as const)
        : ("warning" as const);
