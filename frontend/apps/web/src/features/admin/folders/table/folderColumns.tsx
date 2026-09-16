import type { Folder } from "@repo/types";
import {
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudBadge } from "../../components/crud";
import { getFolderStatusTone } from "./folderStatus";

export const folderColumns: DataTableColumn<Folder>[] = [
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.name}
        secondary={row.parentFolderId ? "Nested folder" : "Root folder"}
      />
    ),
    header: "Folder",
    id: "name",
    sticky: true,
    width: 260,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={getFolderStatusTone(row.status)}>{row.status}</CrudBadge>
    ),
    header: "Status",
    id: "status",
    width: 130,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={String(row.sortOrder)}
        secondary={row.color ?? "Default color"}
      />
    ),
    header: "Order",
    id: "sortOrder",
    width: 130,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.description ?? "—"} />,
    header: "Description",
    id: "description",
    width: 280,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
    header: "Updated",
    id: "updatedAt",
    width: 150,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.icon ?? "-"} />,
    header: "Icon",
    id: "icon",
    width: 130,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.color ?? "Default"} />,
    header: "Color",
    id: "color",
    width: 130,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={row.isActive ? "success" : "danger"}>
        {row.isActive ? "Active" : "Inactive"}
      </CrudBadge>
    ),
    header: "Lifecycle",
    id: "isActive",
    width: 120,
  },
  {
    cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
    header: "Created",
    id: "createdAt",
    width: 150,
  },
];
