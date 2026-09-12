"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight } from "lucide-react";
import { AppEmptyState, Text, XStack, YStack } from "@repo/ui";
import { studentsApi } from "@repo/api";
import type { StudentCourseItem } from "@repo/types";

import {
  DataTable,
  DataTablePagination,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudSelect } from "@/features/shared/forms/CrudSelect";
import { CourseProgressBar } from "./components/CourseProgressBar";
import { CourseStatusBadge } from "./components/CourseStatusBadge";
import { CourseResourceSummary } from "./components/CourseResourceSummary";
import { ViewToggle } from "./components/ViewToggle";
import { StudentCoursesLoading } from "./components/StudentCoursesLoading";
import { StudentCoursesError } from "./components/StudentCoursesError";
import { StudentCourseCard } from "./components/StudentCourseCard";
import {
  formatRelativeTimestamp,
  getCompactActionLabel,
} from "./utils/courses.list.util";
import type { StudentCourseViewMode } from "./types";
import { courseVisualVariants, PAGE_SIZE } from "./constants";
import { CourseTableNameCell } from "./components/CourseTableNameCell";

const emptyStateTable = {
  description: "Your assigned courses will appear here.",
  title: "No courses assigned yet",
};

const emptyStateDescription =
  "Your assigned courses will appear here once your enrollment is active.";

const emptyStateTitle = "No courses assigned yet";

export const StudentCoursesPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState<StudentCourseViewMode>("cards");
  const selectedCategory = category === "ALL" ? undefined : category;

  const coursesQuery = useQuery({
    queryFn: () =>
      studentsApi.findMyCourses({
        category: selectedCategory,
        limit: PAGE_SIZE,
        page,
      }),
    queryKey: ["student-courses", page, selectedCategory],
    staleTime: 60_000,
  });

  const courses = coursesQuery.data?.items ?? [];

  const categories = coursesQuery.data?.categories ?? [];

  const categoryOptions = [
    { label: "All Categories", value: "ALL" },
    ...categories.map((item) => ({ label: item, value: item })),
  ];

  const columns = useMemo<DataTableColumn<StudentCourseItem>[]>(
    () => [
      {
        cell: ({ row, rowIndex }) => (
          <CourseTableNameCell
            course={row}
            variant={
              courseVisualVariants[rowIndex % courseVisualVariants.length]
            }
          />
        ),
        header: "Course",
        id: "course",
        sticky: true,
        width: 270,
      },
      {
        cell: ({ row, rowIndex }) => (
          <CourseStatusBadge
            status={row.status}
            variant={
              courseVisualVariants[rowIndex % courseVisualVariants.length]
            }
          />
        ),
        header: "Status",
        id: "status",
        width: 122,
      },
      {
        cell: ({ row, rowIndex }) => (
          <CourseProgressBar
            value={row.completionPercentage}
            variant={
              courseVisualVariants[rowIndex % courseVisualVariants.length]
            }
          />
        ),
        header: "Progress",
        id: "progress",
        width: 145,
      },
      {
        cell: ({ row, rowIndex }) => (
          <CourseResourceSummary
            counts={row.resourceCounts}
            variant={
              courseVisualVariants[rowIndex % courseVisualVariants.length]
            }
          />
        ),
        header: "Resources",
        id: "resources",
        width: 215,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={row.lastAccessed?.title ?? "-"}
            secondary={
              row.lastAccessed
                ? formatRelativeTimestamp(row.lastAccessed.timestamp)
                : "Not accessed"
            }
          />
        ),
        header: "Last Accessed",
        id: "lastAccessed",
        width: 225,
      },
      {
        align: "right",
        cell: ({ row, rowIndex }) => (
          <button
            className={`student-course-table-action ${
              courseVisualVariants[rowIndex % courseVisualVariants.length]
            }`}
            onClick={() => router.push(row.continuePath)}
            type="button"
          >
            {getCompactActionLabel(row)}
            <ChevronRight aria-hidden="true" size={13} strokeWidth={2.4} />
          </button>
        ),
        header: "Action",
        id: "action",
        meta: { stickyEnd: true },
        width: 112,
      },
    ],
    [router],
  );

  const pagination = {
    entityLabel: "courses",
    mode: "server" as any,
    page,
    pageSize: PAGE_SIZE,
    pageSizeOptions: [10],
    total: coursesQuery.data?.meta.total ?? 0,
    totalPages: coursesQuery.data?.meta.totalPages ?? 1,
  };

  return (
    <YStack className="student-courses-page">
      <XStack className="student-courses-page-header">
        <YStack className="student-courses-title-block">
          <Text className="student-courses-page-title">My Courses</Text>
          <Text className="student-courses-page-subtitle">
            Continue your learning journey
          </Text>
        </YStack>
        <XStack className="student-courses-toolbar">
          <CrudSelect
            ariaLabel="Filter courses by category"
            label="Category"
            loading={coursesQuery.isFetching}
            onChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
            options={categoryOptions}
            value={category}
            width={170}
          />
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </XStack>
      </XStack>

      {coursesQuery.isLoading ? <StudentCoursesLoading /> : null}
      {coursesQuery.isError ? (
        <StudentCoursesError onRetry={() => void coursesQuery.refetch()} />
      ) : null}

      {courses.length ? (
        viewMode === "cards" ? (
          <YStack className="student-course-list-stack">
            <div className="student-course-card-grid">
              {courses.map((course, index) => (
                <StudentCourseCard
                  course={course}
                  key={course.id}
                  variant={
                    courseVisualVariants[index % courseVisualVariants.length]
                  }
                />
              ))}
            </div>
            <DataTablePagination
              page={page}
              pageSize={PAGE_SIZE}
              pageSizeOptions={[PAGE_SIZE]}
              pagination={{ entityLabel: "courses" }}
              setPage={setPage}
              setPageSize={() => setPage(1)}
              total={coursesQuery.data?.meta.total ?? 0}
              totalPages={coursesQuery.data?.meta.totalPages ?? 1}
            />
          </YStack>
        ) : (
          <div className="student-courses-table-view">
            <DataTable<StudentCourseItem>
              columns={columns}
              data={courses}
              emptyState={emptyStateTable}
              getRowId={(course) => course.id}
              loading={coursesQuery.isLoading}
              onPageChange={setPage}
              pagination={pagination}
              renderToolbar={() => null}
              searchable={false}
              stickyFirstColumn
              stickyHeader
            />
          </div>
        )
      ) : (
        <AppEmptyState
          description={emptyStateDescription}
          icon={<BookOpen color="#059669" size={30} strokeWidth={2.1} />}
          title={emptyStateTitle}
        />
      )}
    </YStack>
  );
};

export default StudentCoursesPage;
