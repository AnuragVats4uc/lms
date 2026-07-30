import type { Organization } from "@repo/types";

import type { OrganizationTableRow } from "../types";
import {
  getAdministrator,
  getDomain,
  getSyncStatus,
} from "../utils/organization";

export function toOrganizationRow(
  organization: Organization,
): OrganizationTableRow {
  return {
    ...organization,
    domain: getDomain(organization),
    metrics: {
      courses: 0,
      resources: 0,
      storageLimitGb: 0,
      storageUsedGb: 0,
      students: 0,
      users: 0,
    },
    primaryAdministrator: getAdministrator(organization),
    syncStatus: getSyncStatus(organization),
  };
}
