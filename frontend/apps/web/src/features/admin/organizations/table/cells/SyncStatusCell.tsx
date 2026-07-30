import { DataTableBadgeCell } from "@/components/DataTable";

import type { OrganizationSyncStatus } from "../../types";
import { getSyncLabel, getSyncTone } from "../../utils";

export function SyncStatusCell({
  syncStatus,
}: {
  syncStatus: OrganizationSyncStatus;
}) {
  return (
    <DataTableBadgeCell
      label={getSyncLabel(syncStatus)}
      tone={getSyncTone(syncStatus)}
    />
  );
}
