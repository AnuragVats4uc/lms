import { DataTableBadgeCell } from "@/components/DataTable";

import type { OrganizationTableRow } from "../../types";
import { getStatusTone } from "../../utils";

export function StatusCell({
  organization,
}: {
  organization: OrganizationTableRow;
}) {
  return (
    <DataTableBadgeCell
      label={
        organization.status === "ACTIVE" && organization.isActive
          ? "Active"
          : "Inactive"
      }
      tone={getStatusTone(organization)}
    />
  );
}
