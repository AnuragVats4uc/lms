"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, UsersRound } from "lucide-react";
import { getApiErrorMessage, teacherApi } from "@repo/api";
import type { TeacherStudentListItem } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { CrudPageHeader, CrudToolbar } from "@/features/shared/crud";
import { createStudentColumns } from "./TeacherStudentColumns";

export const TeacherStudentsPage = () => {
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

  const tableActions = [
    {
      icon: <BarChart3 aria-hidden="true" size={16} />,
      id: "activity-report",
      label: "Activity report",
      onAction: (row: TeacherStudentListItem) =>
        router.push(
          `/teacher/students/${row.student.id}/${row.student.uuid}/activity`,
        ),
    },
  ];

  const tableEmptyState = {
    description:
      search || sessionCourseId
        ? "No enrolled students match the current filters."
        : "No students are enrolled in your assigned courses yet.",
    icon: <UsersRound aria-hidden="true" size={28} />,
    title:
      search || sessionCourseId ? "No matching students" : "No students found",
  };

  const tableError = studentsQuery.isError
    ? {
        description: getApiErrorMessage(
          studentsQuery.error,
          "The student list could not be loaded.",
        ),
        onRetry: () => void studentsQuery.refetch(),
        title: "Unable to load students",
      }
    : null;

  const tablePagination = {
    entityLabel: "students",
    mode: "server" as any,
    page,
    pageSize: limit,
    pageSizeOptions: [10, 25, 50],
    total: data?.meta.total ?? 0,
    totalPages: data?.meta.totalPages ?? 0,
  };

  const handleOnClear = () => {
    setSearch("");
    setSessionCourseId("");
    setPage(1);
  };

  const handleOnFilterChange = (id: string, value: string) => {
    setSessionCourseId(value);
    setPage(1);
  };

  const handleOnSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleOnRowClick = (row: TeacherStudentListItem) => {
    router.push(
      `/teacher/students/${row.student.id}/${row.student.uuid}/activity`,
    );
  };

  const handleOnPageSizeChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

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
        onClear={handleOnClear}
        onFilterChange={handleOnFilterChange}
        onSearch={handleOnSearch}
        searchPlaceholder="Search students..."
        searchValue={search}
        values={{ course: sessionCourseId }}
      />
      <DataTable<TeacherStudentListItem>
        actions={tableActions}
        columns={columns}
        data={data?.items ?? []}
        emptyState={tableEmptyState}
        error={tableError}
        getRowId={(item) => item.id}
        loading={studentsQuery.isLoading}
        onRowClick={handleOnRowClick}
        onPageChange={setPage}
        onPageSizeChange={handleOnPageSizeChange}
        pagination={tablePagination}
        renderToolbar={() => null}
        searchable={false}
        stickyFirstColumn
        stickyHeader
      />
    </PageContainer>
  );
};
