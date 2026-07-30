import { Organization } from "@repo/types";

export type OrganizationSyncStatus = "SYNCED" | "PENDING" | "FAILED";

export interface OrganizationAdministrator {
  avatar?: string;
  email: string;
  name: string;
}

export interface OrganizationMetrics {
  courses: number;
  resources: number;
  storageLimitGb: number;
  storageUsedGb: number;
  students: number;
  users: number;
}

export interface OrganizationTableRow extends Organization {
  domain: string | null;
  metrics: OrganizationMetrics;
  primaryAdministrator: OrganizationAdministrator | null;
  syncStatus: OrganizationSyncStatus;
}

export interface OrganizationRowActionHandlers {
  onAssignCourses: (organization: OrganizationTableRow) => void;
  onDelete: (organization: OrganizationTableRow) => void;
  onEdit: (organization: OrganizationTableRow) => void;
  onManageUsers: (organization: OrganizationTableRow) => void;
  onToggleActive: (organization: OrganizationTableRow) => void;
  onView: (organization: OrganizationTableRow) => void;
  onViewAnalytics: (organization: OrganizationTableRow) => void;
}
