import type { StudentNotificationItem } from "@repo/types";

import type { NotificationDateGroup } from "../types";

export const groupNotificationsByDate = (
  items: StudentNotificationItem[],
): NotificationDateGroup[] => {
  const groups = new Map<string, StudentNotificationItem[]>();
  for (const item of items) {
    const label = dateGroup(item.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return [...groups.entries()].map(([label, groupedItems]) => ({
    label,
    items: groupedItems,
  }));
};

export const dateGroup = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const difference = Math.round(
    (today.getTime() - target.getTime()) / 86_400_000,
  );
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference < 7) return "Earlier this week";
  return "Earlier";
};
