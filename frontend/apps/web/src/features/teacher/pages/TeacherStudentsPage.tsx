"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, UsersRound } from "lucide-react";
import { getApiErrorMessage, teacherApi } from "@repo/api";
import type { TeacherStudentListItem } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";
import {
  DataTable,
  DataTableBadgeCell,
  DataTableDateCell,
  DataTableEmailCell,
  DataTablePhoneCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudPageHeader, CrudToolbar } from "@/features/admin/components/crud";

export function TeacherStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [sessionCourseId, setSessionCourseId] = useState("");

  const coursesQuery = useQuery({
    queryFn: () => teacherApi.findCourses({ limit: 100, page: 1 }),
    queryKey: ["teacher-student-course-options"],
    staleTime: 60_000,
  });
  const studentsQuery = useQuery({
    queryFn: () =>
      teacherApi.findStudents({
        limit,
        page,
        search: search || undefined,
        sessionCourseId: sessionCourseId ? Number(sessionCourseId) : undefined,
      }),
    queryKey: ["teacher-students", page, limit, search, sessionCourseId],
    staleTime: 60_000,
  });

  const columns = useMemo<DataTableColumn<TeacherStudentListItem>[]>(
    () => createStudentColumns(),
    [],
  );
  const data = studentsQuery.data;
  const courseOptions = [
    { label: "All courses", value: "" },
    ...(coursesQuery.data?.items.map((course) => ({
      label: course.title,
      value: String(course.sessionCourseId),
    })) ?? []),
  ];

  return (
    <PageContainer>
      <CrudPageHeader
        canCreate={false}
        createLabel=""
        description="View students enrolled in your assigned session courses."
        isFetching={studentsQuery.isFetching}
        onCreate={() => undefined}
        onRefresh={() => void studentsQuery.refetch()}
        title="Students"
      />
      <CrudToolbar
        entityLabel="Students"
        filters={[{ id: "course", label: "Course", options: courseOptions }]}
        loading={studentsQuery.isFetching}
        onClear={() => {
          setSearch("");
          setSessionCourseId("");
          setPage(1);
        }}
        onFilterChange={(_, value) => {
          setSessionCourseId(value);
          setPage(1);
        }}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search students..."
        searchValue={search}
        values={{ course: sessionCourseId }}
      />
      <DataTable<TeacherStudentListItem>
        actions={[
          {
            icon: <BarChart3 aria-hidden="true" size={16} />,
            id: "activity-report",
            label: "Activity report",
            onAction: (row) =>
              router.push(
                `/teacher/students/${row.student.id}/${row.student.uuid}/activity`,
              ),
          },
        ]}
        columns={columns}
        data={data?.items ?? []}
        emptyState={{
          description:
            search || sessionCourseId
              ? "No enrolled students match the current filters."
              : "No students are enrolled in your assigned courses yet.",
          icon: <UsersRound aria-hidden="true" size={28} />,
          title:
            search || sessionCourseId
              ? "No matching students"
              : "No students found",
        }}
        error={
          studentsQuery.isError
            ? {
                description: getApiErrorMessage(
                  studentsQuery.error,
                  "The student list could not be loaded.",
                ),
                onRetry: () => void studentsQuery.refetch(),
                title: "Unable to load students",
              }
            : null
        }
        getRowId={(item) => item.id}
        loading={studentsQuery.isLoading}
        onRowClick={(row) =>
          router.push(
            `/teacher/students/${row.student.id}/${row.student.uuid}/activity`,
          )
        }
        onPageChange={setPage}
        onPageSizeChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
        pagination={{
          entityLabel: "students",
          mode: "server",
          page,
          pageSize: limit,
          pageSizeOptions: [10, 25, 50],
          total: data?.meta.total ?? 0,
          totalPages: data?.meta.totalPages ?? 0,
        }}
        renderToolbar={() => null}
        searchable={false}
        stickyFirstColumn
        stickyHeader
      />
    </PageContainer>
  );
}

function createStudentColumns(): DataTableColumn<TeacherStudentListItem>[] {
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
}
