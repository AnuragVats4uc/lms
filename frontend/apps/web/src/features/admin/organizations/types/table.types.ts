import type { OrganizationTableRow } from "./organization.types";

export interface OrganizationRowActionHandlers {
  onAssignCourses: (organization: OrganizationTableRow) => void;
  onDelete: (organization: OrganizationTableRow) => void;
  onEdit: (organization: OrganizationTableRow) => void;
  onManageUsers: (organization: OrganizationTableRow) => void;
  onToggleActive: (organization: OrganizationTableRow) => void;
  onView: (organization: OrganizationTableRow) => void;
  onViewAnalytics: (organization: OrganizationTableRow) => void;
}
