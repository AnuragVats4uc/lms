"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Grid3X3,
  HelpCircle,
  List,
  MoreVertical,
  Play,
  RefreshCw,
  Trophy,
  Video,
} from "lucide-react";
import {
  AppEmptyState,
  Button,
  Card,
  Spinner,
  Text,
  XStack,
  YStack,
} from "@repo/ui";
import { AppBadge } from "@repo/ui/primitives";
import { studentsApi } from "@repo/api";
import type { StudentCourseItem, StudentCourseStatus } from "@repo/types";

import {
  DataTable,
  DataTablePagination,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudSelect } from "@/features/admin/components/crud";

type StudentCourseViewMode = "cards" | "table";
type CourseVisualVariant = "mint" | "purple" | "blue" | "amber";

const PAGE_SIZE = 10;
const courseVisualVariants: CourseVisualVariant[] = [
  "mint",
  "purple",
  "blue",
  "amber",
];

const statusLabels: Record<StudentCourseStatus, string> = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN PROGRESS",
  NOT_STARTED: "NOT STARTED",
};

export function StudentCoursesPage() {
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
        cell: ({ row }) => (
          <DataTableTextCell
            primary={row.title}
            secondary={`${row.program} • ${row.instructor}`}
          />
        ),
        header: "Course",
        id: "course",
        sticky: true,
        width: 280,
      },
      {
        cell: ({ row }) => (
          <AppBadge tone={statusTone(row.status)}>
            {statusLabels[row.status]}
          </AppBadge>
        ),
        header: "Status",
        id: "status",
        width: 130,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={`${clampPercentage(row.completionPercentage)}%`}
            secondary="Completed"
          />
        ),
        header: "Progress",
        id: "progress",
        width: 120,
      },
      {
        align: "right",
        accessorFn: (row) => row.resourceCounts.videos,
        header: "Videos",
        id: "videos",
        width: 100,
      },
      {
        align: "right",
        accessorFn: (row) => row.resourceCounts.documents,
        header: "Documents",
        id: "documents",
        width: 120,
      },
      {
        align: "right",
        accessorFn: (row) => row.resourceCounts.exams,
        header: "Exams",
        id: "exams",
        width: 90,
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
        width: 240,
      },
    ],
    [],
  );

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

      {coursesQuery.isLoading ? (
        <StudentCoursesLoading />
      ) : coursesQuery.isError ? (
        <StudentCoursesError onRetry={() => void coursesQuery.refetch()} />
      ) : courses.length ? (
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
          <DataTable<StudentCourseItem>
            actions={[
              {
                id: "continue",
                label: "Continue",
                icon: (
                  <ChevronRight aria-hidden="true" color="#059669" size={15} />
                ),
                onAction: (course) => router.push(course.continuePath),
              },
            ]}
            columns={columns}
            data={courses}
            emptyState={{
              description: "Your assigned courses will appear here.",
              title: "No courses assigned yet",
            }}
            getRowId={(course) => course.id}
            loading={coursesQuery.isLoading}
            onPageChange={setPage}
            pagination={{
              entityLabel: "courses",
              mode: "server",
              page,
              pageSize: PAGE_SIZE,
              pageSizeOptions: [10],
              total: coursesQuery.data?.meta.total ?? 0,
              totalPages: coursesQuery.data?.meta.totalPages ?? 1,
            }}
            renderToolbar={() => null}
            searchable={false}
            stickyFirstColumn
            stickyHeader
          />
        )
      ) : (
        <AppEmptyState
          description="Your assigned courses will appear here once your enrollment is active."
          icon={<BookOpen color="#059669" size={30} strokeWidth={2.1} />}
          title="No courses assigned yet"
        />
      )}

      {/* <StudentCoursesHelp /> */}
    </YStack>
  );
}

function ViewToggle({
  onChange,
  value,
}: {
  onChange: (value: StudentCourseViewMode) => void;
  value: StudentCourseViewMode;
}) {
  return (
    <div
      className="student-course-view-toggle"
      role="group"
      aria-label="Course view"
    >
      <button
        aria-label="Card view"
        className={value === "cards" ? "is-active" : ""}
        onClick={() => onChange("cards")}
        type="button"
      >
        <Grid3X3 aria-hidden="true" size={16} strokeWidth={2.2} />
      </button>
      <button
        aria-label="Table view"
        className={value === "table" ? "is-active" : ""}
        onClick={() => onChange("table")}
        type="button"
      >
        <List aria-hidden="true" size={16} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function StudentCourseCard({
  course,
  variant,
}: {
  course: StudentCourseItem;
  variant: CourseVisualVariant;
}) {
  const router = useRouter();
  const progress = clampPercentage(course.completionPercentage);

  return (
    <Card className="student-course-panel-card">
      <XStack className="student-course-card-content">
        {course.image ? (
          <div
            aria-label={course.title}
            className="student-course-art"
            role="img"
            style={{ backgroundImage: `url("${course.image}")` }}
          />
        ) : (
          <CourseVisual
            shortCode={course.shortCode}
            title={course.title}
            variant={variant}
          />
        )}
        <YStack className="student-course-card-details">
          <XStack className="student-course-card-head">
            <AppBadge tone={statusTone(course.status)}>
              {statusLabels[course.status]}
            </AppBadge>
            <button
              aria-label={`Open ${course.title}`}
              className="student-course-menu-button"
              onClick={() => router.push(course.continuePath)}
              type="button"
            >
              <MoreVertical aria-hidden="true" size={18} strokeWidth={2.2} />
            </button>
          </XStack>
          <Text className="student-course-main-title" numberOfLines={2}>
            {course.title}
          </Text>
          <Text className="student-course-program" numberOfLines={1}>
            {course.program}
          </Text>
          <Text className="student-course-description" numberOfLines={2}>
            {course.description ??
              "Course content assigned through your active batch."}
          </Text>
          <XStack className="student-course-stats-row">
            <CircularProgress value={progress} variant={variant} />
            <div className="student-course-stat-grid">
              <CourseStat
                Icon={Video}
                label="Videos"
                value={course.resourceCounts.videos}
                variant={variant}
              />
              <CourseStat
                Icon={FileText}
                label="Documents"
                value={course.resourceCounts.documents}
                variant={variant}
              />
              <CourseStat
                Icon={Trophy}
                label="Exams"
                value={course.resourceCounts.exams}
                variant={variant}
              />
            </div>
          </XStack>
        </YStack>
      </XStack>
      <XStack className="student-course-card-footer">
        <YStack className="student-course-last-accessed">
          <Text>Last accessed</Text>
          <XStack>
            <strong>
              {course.lastAccessed
                ? `${course.lastAccessed.title} (${formatResourceType(course.lastAccessed.type)})`
                : "-"}
            </strong>
            {course.lastAccessed ? (
              <span>
                {formatRelativeTimestamp(course.lastAccessed.timestamp)}
              </span>
            ) : null}
          </XStack>
        </YStack>
        <button
          className={`student-course-continue-button ${variant}`}
          onClick={() => router.push(course.continuePath)}
          type="button"
        >
          <span>{course.actionLabel}</span>
          <Play
            aria-hidden="true"
            fill="currentColor"
            size={14}
            strokeWidth={0}
          />
        </button>
      </XStack>
    </Card>
  );
}

function CourseVisual({
  shortCode,
  title,
  variant,
}: {
  shortCode: string;
  title: string;
  variant: CourseVisualVariant;
}) {
  return (
    <div
      className={`student-course-visual ${variant}`}
      aria-label={title}
      role="img"
    >
      <div className="student-course-visual-sun" />
      <div className="student-course-visual-line line-one" />
      <div className="student-course-visual-line line-two" />
      <div className="student-course-visual-book" />
      <div className="student-course-visual-badge">{shortCode}</div>
    </div>
  );
}

function CircularProgress({
  value,
  variant,
}: {
  value: number;
  variant: CourseVisualVariant;
}) {
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`student-course-progress-ring ${variant}`}>
      <svg aria-hidden="true" height="70" viewBox="0 0 70 70" width="70">
        <circle className="track" cx="35" cy="35" r={radius} />
        <circle
          className="value"
          cx="35"
          cy="35"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div>
        <strong>{value}%</strong>
        <span>Completed</span>
      </div>
    </div>
  );
}

function CourseStat({
  Icon,
  label,
  value,
  variant,
}: {
  Icon: typeof Video;
  label: string;
  value: number;
  variant: CourseVisualVariant;
}) {
  return (
    <YStack className={`student-course-stat ${variant}`}>
      <XStack gap={4} style={{ alignItems: "center" }}>
        <Icon aria-hidden="true" size={13} strokeWidth={2.3} />
        <strong>{value}</strong>
      </XStack>
      <YStack>
        <span>{label}</span>
      </YStack>
    </YStack>
  );
}

function StudentCoursesLoading() {
  return (
    <YStack className="student-courses-state">
      <Spinner color="#059669" size="large" />
      <Text>Loading courses...</Text>
    </YStack>
  );
}

function StudentCoursesError({ onRetry }: { onRetry: () => void }) {
  return (
    <YStack className="student-courses-state">
      <HelpCircle color="#B42318" size={30} strokeWidth={2.1} />
      <Text>Unable to load courses</Text>
      <Button
        background="#059669"
        borderColor="#059669"
        borderWidth={1}
        height={36}
        onPress={onRetry}
        rounded="$3"
      >
        <RefreshCw aria-hidden="true" color="#FFFFFF" size={15} />
        <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
          Retry
        </Button.Text>
      </Button>
    </YStack>
  );
}

function statusTone(status: StudentCourseStatus) {
  if (status === "COMPLETED") return "green" as const;
  if (status === "NOT_STARTED") return "gray" as const;
  return "orange" as const;
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatResourceType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatRelativeTimestamp(value: string) {
  const date = new Date(value);
  const delta = Date.now() - date.getTime();

  if (!Number.isFinite(delta)) return "";

  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default StudentCoursesPage;
