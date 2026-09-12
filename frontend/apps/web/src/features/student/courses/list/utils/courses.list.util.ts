import { StudentCourseItem } from "@repo/types";

export const clampPercentage = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

export const getCompactActionLabel = (course: StudentCourseItem) => {
  return course.completionPercentage > 0 ? "Continue" : "Start";
};

export const formatRelativeTimestamp = (value: string) => {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();

  if (!Number.isFinite(delta)) return "";

  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};