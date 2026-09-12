import { DataTableBadgeCell, DataTableColumn, DataTableTextCell } from "@/components/DataTable";
import { TeacherDashboardCourse } from "@repo/types";

export const createCourseColumns = (): DataTableColumn<TeacherDashboardCourse>[] => {
  return [
    {
      cell: ({ row }) => (
        <DataTableTextCell primary={row.title} secondary={row.code} />
      ),
      header: "Course",
      id: "course",
      sticky: true,
      width: 280,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.session.name}
          secondary={row.session.code ?? "No code"}
        />
      ),
      header: "Session",
      id: "session",
      width: 220,
    },
    {
      cell: ({ row }) => (
        <DataTableBadgeCell
          label={row.isPublished ? "Published" : row.status}
          tone={row.isPublished ? "green" : "gray"}
        />
      ),
      header: "Status",
      id: "status",
      width: 130,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={String(row.enrolledStudents)}
          secondary="enrolled"
        />
      ),
      header: "Students",
      id: "students",
      width: 130,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell primary={String(row.folders)} secondary="folders" />
      ),
      header: "Folders",
      id: "folders",
      width: 120,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={String(row.resources)}
          secondary={`${row.publishedResources} published`}
        />
      ),
      header: "Resources",
      id: "resources",
      width: 150,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell primary={row.description ?? "No description"} />
      ),
      header: "Description",
      id: "description",
      minWidth: 260,
    },
  ];
};