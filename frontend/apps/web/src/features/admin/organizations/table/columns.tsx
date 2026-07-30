import { Text } from "@repo/ui";

import {
  DataTableDateCell,
  DataTableEmailCell,
  DataTablePhoneCell,
  type DataTableColumn,
} from "@/components/DataTable";

import type {
  OrganizationRowActionHandlers,
  OrganizationTableRow,
} from "../types";
import {
  ActionsCell,
  AdministratorAvatarCell,
  AvatarCell,
  MetricsCell,
  StatusCell,
  SyncStatusCell,
  WebsiteCell,
} from "./cells";

function EmptyCell() {
  return (
    <Text color="#52627A" fontSize="$caption">
      -
    </Text>
  );
}

export function createOrganizationColumns(
  handlers: OrganizationRowActionHandlers,
): DataTableColumn<OrganizationTableRow>[] {
  return [
    {
      cell: ({ row }) => <AvatarCell organization={row} />,
      header: "Organization",
      id: "organization",
      searchable: true,
      sticky: true,
      width: 280,
    },
    {
      cell: ({ row }) => <AdministratorAvatarCell organization={row} />,
      header: "Primary Administrator",
      id: "administrator",
      width: 240,
    },
    {
      cell: ({ row }) =>
        row.email ? <DataTableEmailCell href={row.email} /> : <EmptyCell />,
      header: "Email",
      id: "email",
      searchable: true,
      width: 240,
    },
    {
      cell: ({ row }) => <DataTablePhoneCell value={row.phone} />,
      header: "Phone",
      id: "phone",
      width: 160,
    },
    {
      cell: ({ row }) => <WebsiteCell organization={row} />,
      header: "Website",
      id: "website",
      width: 180,
    },
    {
      align: "right",
      cell: ({ row }) => <MetricsCell value={row.metrics.users} />,
      header: "Users",
      id: "users",
      width: 96,
    },
    {
      align: "right",
      cell: ({ row }) => <MetricsCell value={row.metrics.courses} />,
      header: "Courses",
      id: "courses",
      width: 104,
    },
    {
      align: "right",
      cell: ({ row }) => <MetricsCell value={row.metrics.students} />,
      header: "Students",
      id: "students",
      width: 104,
    },
    {
      cell: ({ row }) => <StatusCell organization={row} />,
      header: "Status",
      id: "status",
      width: 108,
    },
    {
      cell: ({ row }) => <SyncStatusCell syncStatus={row.syncStatus} />,
      header: "Sync Status",
      id: "syncStatus",
      width: 118,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
      header: "Created",
      id: "createdAt",
      width: 126,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
      header: "Updated",
      id: "updatedAt",
      width: 126,
    },
    {
      align: "center",
      cell: ({ row }) => (
        <ActionsCell handlers={handlers} organization={row} />
      ),
      header: "Actions",
      id: "actions",
      meta: { stickyEnd: true },
      width: 76,
    },
  ];
}
