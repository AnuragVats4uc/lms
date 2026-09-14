import type { ResourceStatus, StudentResourceItem } from "@repo/types";

export const formatDuration = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
};

export const formatEnum = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatSizeOrDuration = (resource: StudentResourceItem) => {
  if (resource.resourceType.code === "VIDEO") {
    return resource.durationInSeconds == null
      ? "—"
      : formatDuration(resource.durationInSeconds);
  }
  if (!resource.fileSize) return "—";
  const bytes = Number(resource.fileSize);
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${Math.round(bytes / 1_024)} KB`;
  return `${bytes} B`;
};

export const percentageLabel = (value: number, total: number) =>
  total ? `${Math.round((value / total) * 100)}% of total` : "0% of total";

export const resourceFormat = (resource: StudentResourceItem) => {
  if (resource.resourceType.code === "VIDEO") return "VIDEO";
  if (resource.resourceType.code === "EXAM") return "EXAM";
  const mime = resource.mimeType?.toLowerCase() ?? "";
  if (mime.includes("presentation")) return "PPT";
  if (mime.includes("word")) return "DOC";
  if (mime.includes("pdf")) return "PDF";
  return "FILE";
};

export const resourcePath = (resource: StudentResourceItem) => {
  if (resource.resourceType.code === "DOCUMENT")
    return `/student/resources/${resource.id}`;
  if (resource.resourceType.code === "VIDEO")
    return `/student/resources/${resource.id}/video`;
  if (resource.resourceType.code === "EXAM")
    return `/student/resources/${resource.id}/exam`;
  return null;
};

export const statusTone = (status: ResourceStatus) => {
  if (status === "PUBLISHED") return "green" as const;
  if (status === "ARCHIVED") return "gray" as const;
  return "orange" as const;
};
