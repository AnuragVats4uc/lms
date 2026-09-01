"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getApiErrorMessage, teacherApi } from "@repo/api";
import type { TeacherDashboardCourse } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";
import {
  DataTable,
  DataTableBadgeCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudPageHeader, CrudToolbar } from "@/features/admin/components/crud";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
];

export function TeacherCoursesPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState("");

  const coursesQuery = useQuery({
    queryFn: () =>
      teacherApi.findCourses({
        limit,
        page,
        search: search || undefined,
        status: status || undefined,
      }),
    queryKey: ["teacher-courses", page, limit, search, status],
    staleTime: 60_000,
  });

  const columns = useMemo<DataTableColumn<TeacherDashboardCourse>[]>(
    () => createCourseColumns(),
    [],
  );
  const data = coursesQuery.data;

  return (
    <PageContainer>
      <CrudPageHeader
        canCreate={false}
        createLabel=""
        description="Review the session courses assigned to your teacher account."
        isFetching={coursesQuery.isFetching}
        onCreate={() => undefined}
        onRefresh={() => void coursesQuery.refetch()}
        title="My Courses"
      />
      <CrudToolbar
        entityLabel="Courses"
        filters={[
          {
            id: "status",
            label: "Status",
            options: statusOptions,
          },
        ]}
        loading={coursesQuery.isFetching}
        onClear={() => {
          setSearch("");
          setStatus("");
          setPage(1);
        }}
        onFilterChange={(_, value) => {
          setStatus(value);
          setPage(1);
        }}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search assigned courses..."
        searchValue={search}
        values={{ status }}
      />
      <DataTable<TeacherDashboardCourse>
        columns={columns}
        data={data?.items ?? []}
        emptyState={{
          description:
            search || status
              ? "No assigned courses match the current filters."
              : "No courses are assigned to this teacher account.",
          icon: <BookOpen aria-hidden="true" size={28} />,
          title: search || status ? "No matching courses" : "No courses found",
        }}
        error={
          coursesQuery.isError
            ? {
                description: getApiErrorMessage(
                  coursesQuery.error,
                  "The course list could not be loaded.",
                ),
                onRetry: () => void coursesQuery.refetch(),
                title: "Unable to load courses",
              }
            : null
        }
        getRowId={(course) => course.sessionCourseId}
        loading={coursesQuery.isLoading}
        onPageChange={setPage}
        onPageSizeChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
        pagination={{
          entityLabel: "courses",
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

function createCourseColumns(): DataTableColumn<TeacherDashboardCourse>[] {
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
}
