import type { AdminStudentDashboardBanner } from "@repo/types";

export const reorderDashboardBannerIds = (
  banners: AdminStudentDashboardBanner[],
  index: number,
  delta: -1 | 1,
) => {
  const ids = banners.map(({ id }) => id);
  const target = index + delta;
  if (target < 0 || target >= ids.length) return null;
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  return ids;
};
