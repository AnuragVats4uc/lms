export const formatDashboardUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
