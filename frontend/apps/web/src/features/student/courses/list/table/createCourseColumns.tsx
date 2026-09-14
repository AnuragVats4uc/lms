import { ChevronRight } from "lucide-react";
import type { StudentCourseItem } from "@repo/types";

import {
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CourseProgressBar } from "../components/CourseProgressBar";
import { CourseResourceSummary } from "../components/CourseResourceSummary";
import { CourseStatusBadge } from "../components/CourseStatusBadge";
import { CourseTableNameCell } from "../components/CourseTableNameCell";
import { courseVisualVariants } from "../constants";
import {
  formatRelativeTimestamp,
  getCompactActionLabel,
} from "../utils/courses.list.util";

export const createCourseColumns = (
  onOpenCourse: (path: string) => void,
): DataTableColumn<StudentCourseItem>[] => [
  {
    cell: ({ row, rowIndex }) => (
      <CourseTableNameCell
        course={row}
        variant={courseVisualVariants[rowIndex % courseVisualVariants.length]}
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
        variant={courseVisualVariants[rowIndex % courseVisualVariants.length]}
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
        variant={courseVisualVariants[rowIndex % courseVisualVariants.length]}
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
        variant={courseVisualVariants[rowIndex % courseVisualVariants.length]}
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
        onClick={() => onOpenCourse(row.continuePath)}
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
];
