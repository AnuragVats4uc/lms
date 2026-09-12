"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getApiErrorMessage, teacherApi } from "@repo/api";
import type { TeacherDashboardCourse } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { CrudPageHeader, CrudToolbar } from "@/features/shared/crud";
import { createCourseColumns } from "./TeacherCourseColumns";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Archived", value: "ARCHIVED" },
];

const teacherFilters = [
  {
    id: "status",
    label: "Status",
    options: statusOptions,
  },
];

export const TeacherCoursesPage = () => {
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

  const emptyState = {
    description:
      search || status
        ? "No assigned courses match the current filters."
        : "No courses are assigned to this teacher account.",
    icon: <BookOpen aria-hidden="true" size={28} />,
    title: search || status ? "No matching courses" : "No courses found",
  };

  const tableError = coursesQuery.isError
    ? {
        description: getApiErrorMessage(
          coursesQuery.error,
          "The course list could not be loaded.",
        ),
        onRetry: () => void coursesQuery.refetch(),
        title: "Unable to load courses",
      }
    : null;

  const pagination = {
    entityLabel: "courses",
    mode: "server" as any,
    page,
    pageSize: limit,
    pageSizeOptions: [10, 25, 50],
    total: data?.meta.total ?? 0,
    totalPages: data?.meta.totalPages ?? 0,
  };

  const handleOnClear = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const handleFilterChange = (id: string, value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleOnSearch = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1);
  };

  const handlePageSizeChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

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
        filters={teacherFilters}
        loading={coursesQuery.isFetching}
        onClear={handleOnClear}
        onFilterChange={handleFilterChange}
        onSearch={handleOnSearch}
        searchPlaceholder="Search assigned courses..."
        searchValue={search}
        values={{ status }}
      />
      <DataTable<TeacherDashboardCourse>
        columns={columns}
        data={data?.items ?? []}
        emptyState={emptyState}
        error={tableError}
        getRowId={(course) => course.sessionCourseId}
        loading={coursesQuery.isLoading}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        pagination={pagination}
        renderToolbar={() => null}
        searchable={false}
        stickyFirstColumn
        stickyHeader
      />
    </PageContainer>
  );
};
