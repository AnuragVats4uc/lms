import type { StudentNotificationsResponse } from "@repo/types";

export const totalNotificationCategoryCount = (
  data: StudentNotificationsResponse,
) =>{
  return Object.values(data.summary.byType).reduce(
    (total, value) => total + value,
    0,
  );
}
