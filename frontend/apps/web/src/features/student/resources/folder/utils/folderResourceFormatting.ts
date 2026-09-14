import { RESOURCE_TYPE_IDS, type StudentFolderResourceItem } from "@repo/types";
import type { CrudBadgeTone } from "@/features/admin/components/crud";

export function getResourceHref(resource: StudentFolderResourceItem) {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) {
    return `/student/resources/${resource.id}/video`;
  }
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
    return `/student/resources/${resource.id}`;
  }
  return `/student/resources/${resource.id}/exam`;
}

export function getResourceTypeLabel(resource: StudentFolderResourceItem) {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) return "Video";
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) return "Document";
  return "Exam";
}

export function getResourceTypeTone(
  resource: StudentFolderResourceItem,
): CrudBadgeTone {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) return "info";
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) return "warning";
  return "success";
}

export function getResourceDetail(resource: StudentFolderResourceItem) {
  if (
    resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO &&
    resource.durationInSeconds
  ) {
    return `${Math.ceil(resource.durationInSeconds / 60)} min`;
  }
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
    const mimeType = resource.mimeType?.includes("pdf")
      ? "PDF"
      : (resource.mimeType?.split("/").pop()?.toUpperCase() ?? "Document");
    const fileSize = formatFileSize(resource.fileSize);
    return fileSize ? `${mimeType} · ${fileSize}` : mimeType;
  }
  if (resource.exam) {
    return `${resource.exam.questionCount} questions · ${resource.exam.durationMinutes} min`;
  }
  return "Exam";
}

export function getResourceStatus(resource: StudentFolderResourceItem): {
  label: string;
  percentage: number | null;
  tone: CrudBadgeTone;
} {
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) {
    const percentage = Math.max(
      0,
      Math.min(100, resource.progressPercentage ?? 0),
    );
    if (resource.progressStatus === "COMPLETED") {
      return { label: "Completed", percentage: 100, tone: "success" };
    }
    if (resource.progressStatus === "IN_PROGRESS") {
      return { label: `${percentage}% complete`, percentage, tone: "info" };
    }
    return { label: "Not started", percentage: 0, tone: "neutral" };
  }
  if (resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
    return {
      label: resource.isDownloadable ? "Downloadable" : "Available",
      percentage: null,
      tone: resource.isDownloadable ? "info" : "neutral",
    };
  }
  if (resource.progressStatus === "COMPLETED") {
    return { label: "Completed", percentage: null, tone: "success" };
  }
  const availability = resource.exam?.availability ?? "UNAVAILABLE";
  if (availability === "AVAILABLE")
    return { label: "Available", percentage: null, tone: "success" };
  if (availability === "UPCOMING")
    return { label: "Upcoming", percentage: null, tone: "warning" };
  if (availability === "CLOSED")
    return { label: "Closed", percentage: null, tone: "danger" };
  return { label: "Unavailable", percentage: null, tone: "neutral" };
}

export function getResourceIconColors(tone: "video" | "document" | "exam") {
  if (tone === "document") {
    return { background: "#FFF2E7", border: "#FFE2CA", color: "#EA580C" };
  }
  if (tone === "exam") {
    return { background: "#E9F8F1", border: "#D5EFE3", color: "#059669" };
  }
  return { background: "#F0EAFF", border: "#E6DCFF", color: "#7C3AED" };
}

function formatFileSize(value: string | null) {
  if (!value) return null;
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1_024)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
