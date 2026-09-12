import { DataTableBadgeCell, DataTableColumn, DataTableDateCell, DataTableTextCell, DataTableWebsiteCell } from "@/components/DataTable";
import { isManagedResourceDocument, openManagedResourceDocument } from "@/features/resources/openManagedResourceDocument";
import { TeacherDashboardRecentResource } from "@repo/types";

export const createResourceColumns =
  (): DataTableColumn<TeacherDashboardRecentResource>[] => {
    return [
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={row.title}
            secondary={row.description ?? row.folder.name}
          />
        ),
        header: "Resource",
        id: "resource",
        sticky: true,
        width: 300,
      },
      {
        cell: ({ row }) => (
          <DataTableBadgeCell
            label={row.resourceType.name}
            tone={row.resourceType.code === "EXAM" ? "purple" : "green"}
          />
        ),
        header: "Type",
        id: "type",
        width: 130,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={row.sessionCourse.title}
            secondary={
              row.sessionCourse.session?.name ?? row.sessionCourse.courseCode
            }
          />
        ),
        header: "Course",
        id: "course",
        width: 240,
      },
      {
        cell: ({ row }) => <DataTableTextCell primary={row.folder.name} />,
        header: "Folder",
        id: "folder",
        width: 180,
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
        cell: ({ row }) =>
          row.documentUrl ? (
            <DataTableWebsiteCell
              href={row.documentUrl}
              label="Open document"
              onClick={
                isManagedResourceDocument({
                  ...row,
                  folderId: row.folder.id,
                })
                  ? (event) => {
                      event.preventDefault();
                      void openManagedResourceDocument({
                        ...row,
                        folderId: row.folder.id,
                      });
                    }
                  : undefined
              }
            />
          ) : row.videoUrl ? (
            <DataTableWebsiteCell href={row.videoUrl} label="Open video" />
          ) : (
            <DataTableTextCell primary={row.examId ? "Exam resource" : "-"} />
          ),
        header: "Link",
        id: "link",
        width: 160,
      },
      {
        cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
        header: "Updated",
        id: "updatedAt",
        width: 140,
      },
    ];
  };