import type { Course } from "@repo/types";
import {
  DataTableDateCell,
  DataTableTextCell,
  DataTableWebsiteCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudBadge } from "../../../components/crud";
import { formatCourseAmount } from "../../utils/courseFormatting";
import { getCourseStatusTone } from "../../utils/coursePresentation";

export const createCourseColumns = (): DataTableColumn<Course>[] => [
  {
    cell: ({ row }) => (
      <DataTableTextCell primary={row.name} secondary={row.code} />
    ),
    header: "Course",
    id: "name",
    sortable: true,
    sticky: true,
    width: 260,
  },
  {
    cell: ({ row }) => (
      <CrudBadge tone={getCourseStatusTone(row.status)}>{row.status}</CrudBadge>
    ),
    header: "Status",
    id: "status",
    width: 130,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={row.durationInDays ? `${row.durationInDays} days` : "Not set"}
        secondary={row.isActive ? "Active record" : "Inactive record"}
      />
    ),
    header: "Duration",
    id: "duration",
    width: 150,
  },
  {
    cell: ({ row }) => (
      <DataTableTextCell
        primary={formatCourseAmount(row.price)}
        secondary={
          row.discount
            ? `Discount ${formatCourseAmount(row.discount)}`
            : "No discount"
        }
      />
    ),
    header: "Pricing",
    id: "pricing",
    width: 160,
  },
  {
    cell: ({ row }) => <DataTableTextCell primary={row.description ?? "—"} />,
    header: "Description",
    id: "description",
    width: 280,
  },
  {
    cell: ({ row }) =>
      row.thumbnail ? (
        <DataTableWebsiteCell href={row.thumbnail} label="Open thumbnail" />
      ) : (
        <DataTableTextCell primary="-" />
      ),
    header: "Thumbnail",
    id: "thumbnail",
    width: 150,
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
  {
    cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
    header: "Updated",
    id: "updatedAt",
    sortable: true,
    width: 150,
  },
];
