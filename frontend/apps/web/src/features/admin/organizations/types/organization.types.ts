import type { Organization } from "@repo/types";

export type OrganizationSyncStatus = "SYNCED" | "PENDING" | "FAILED";

export interface OrganizationMetrics {
  courses: number;
  resources: number;
  storageLimitGb: number;
  storageUsedGb: number;
  students: number;
  users: number;
}

export interface OrganizationAdministrator {
  avatar?: string;
  email: string;
  name: string;
}

export interface OrganizationTableRow extends Organization {
  domain: string | null;
  metrics: OrganizationMetrics;
  primaryAdministrator: OrganizationAdministrator | null;
  syncStatus: OrganizationSyncStatus;
}

export interface OrganizationToastState {
  id: number;
  message: string;
  title: string;
  tone: "error" | "success";
}
