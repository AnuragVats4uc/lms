import type { StudentActivityResourceBreakdown } from "@repo/types";

export const engagementPercent = (
  resource: Pick<
    StudentActivityResourceBreakdown,
    "activeDurationSeconds" | "idleDurationSeconds"
  >,
) => {
  const total = resource.activeDurationSeconds + resource.idleDurationSeconds;
  return total ? Math.round((resource.activeDurationSeconds / total) * 100) : 0;
};
