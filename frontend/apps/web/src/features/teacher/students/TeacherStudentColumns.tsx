import {
  DataTableBadgeCell,
  DataTableColumn,
  DataTableDateCell,
  DataTableEmailCell,
  DataTablePhoneCell,
  DataTableTextCell,
} from "@/components/DataTable";
import { TeacherStudentListItem } from "@repo/types";

export const createStudentColumns =
  (): DataTableColumn<TeacherStudentListItem>[] => {
    return [
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={row.student.name}
            secondary={row.student.studentCode}
          />
        ),
        header: "Student",
        id: "student",
        sticky: true,
        width: 260,
      },
      {
        cell: ({ row }) => <DataTableEmailCell href={row.student.email} />,
        header: "Email",
        id: "email",
        width: 220,
      },
      {
        cell: ({ row }) => <DataTablePhoneCell value={row.student.phone} />,
        header: "Phone",
        id: "phone",
        width: 150,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={row.sessionCourse.title}
            secondary={row.sessionCourse.session.name}
          />
        ),
        header: "Course",
        id: "course",
        width: 260,
      },
      {
        cell: ({ row }) => (
          <DataTableBadgeCell
            label={row.status}
            tone={row.status === "COMPLETED" ? "blue" : "green"}
          />
        ),
        header: "Enrollment",
        id: "status",
        width: 140,
      },
      {
        cell: ({ row }) => (
          <DataTableBadgeCell
            label={row.student.status}
            tone={row.student.status === "ACTIVE" ? "green" : "gray"}
          />
        ),
        header: "Student Status",
        id: "studentStatus",
        width: 150,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell primary={row.student.gender ?? "-"} />
        ),
        header: "Gender",
        id: "gender",
        width: 120,
      },
      {
        cell: ({ row }) => <DataTableDateCell value={row.enrolledAt} />,
        header: "Enrolled",
        id: "enrolledAt",
        width: 150,
      },
    ];
  };
