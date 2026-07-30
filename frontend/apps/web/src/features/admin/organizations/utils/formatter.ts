import type {
  OrganizationSyncStatus,
  OrganizationTableRow,
} from "../types";

export function parseInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getStatusTone(
  organization: OrganizationTableRow,
): "green" | "gray" {
  return organization.status === "ACTIVE" && organization.isActive
    ? "green"
    : "gray";
}

export function getSyncTone(
  syncStatus: OrganizationSyncStatus,
): "red" | "orange" | "green" {
  if (syncStatus === "FAILED") {
    return "red";
  }

  return syncStatus === "PENDING" ? "orange" : "green";
}

export function getSyncLabel(syncStatus: OrganizationSyncStatus): string {
  return syncStatus === "SYNCED"
    ? "Synced"
    : syncStatus === "PENDING"
      ? "Pending"
      : "Failed";
}
