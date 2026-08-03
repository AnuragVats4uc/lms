import type { CreatedDateFilter } from "../types";

export const isWithinCreatedDate = (
  value: string,
  filter: CreatedDateFilter,
): boolean => {
  if (filter === "all" || filter === "custom") {
    return true;
  }

  const createdAt = new Date(value);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const now = new Date();
  const start = new Date(now);

  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
  }

  if (filter === "7d") {
    start.setDate(now.getDate() - 7);
  }

  if (filter === "30d") {
    start.setDate(now.getDate() - 30);
  }

  if (filter === "90d") {
    start.setDate(now.getDate() - 90);
  }

  return createdAt >= start;
};
