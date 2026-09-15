export const formatDuration = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
};

export const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const formatLabel = (value: string) => {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatAxisDuration = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds >= 3600) {
    const hours = seconds / 3600;
    return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)}h`;
  }
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
};

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
