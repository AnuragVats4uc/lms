import type { SessionCourse } from "@repo/types";
import {
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudBadge } from "../../../components/crud";
import { getSessionCourseStatusTone } from "../../utils/sessionCoursePresentation";

export const createSessionCourseColumns =
  (): DataTableColumn<SessionCourse>[] => [
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.displayName ?? row.course.name}
          secondary={row.course.code}
        />
      ),
      header: "Course",
      id: "course",
      sticky: true,
      width: 280,
    },
    {
      cell: ({ row }) => (
        <CrudBadge tone={getSessionCourseStatusTone(row.status)}>
          {row.status}
        </CrudBadge>
      ),
      header: "Status",
      id: "status",
      width: 130,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.isPublished ? "Published" : "Draft"}
          secondary={`Order ${row.sortOrder}`}
        />
      ),
      header: "Visibility",
      id: "visibility",
      width: 150,
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
      cell: ({ row }) => <DataTableTextCell primary={String(row.sessionId)} />,
      header: "Session ID",
      id: "sessionId",
      width: 110,
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
  ];
