import type { StudentNotificationReadStatus } from "@repo/types";

import { categoryMeta } from "../constants";
import type { CategoryFilter } from "../types";

export const relativeNotificationTime = (value: string) => {
  const differenceSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1000,
  );
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of ranges) {
    if (Math.abs(differenceSeconds) >= seconds) {
      return formatter.format(Math.round(differenceSeconds / seconds), unit);
    }
  }
  return "just now";
};

export const notificationInboxDescription = (
  category: CategoryFilter,
  status: StudentNotificationReadStatus,
  total: number,
) => {
  const state = status === "ALL" ? "" : `${status.toLocaleLowerCase()} `;
  const categoryLabel =
    category === "ALL"
      ? "updates"
      : categoryMeta[category].label.toLocaleLowerCase();
  const singularLabel = categoryLabel.endsWith("s")
    ? categoryLabel.slice(0, -1)
    : categoryLabel;
  return `${total} ${state}${total === 1 ? singularLabel : categoryLabel}`;
};
