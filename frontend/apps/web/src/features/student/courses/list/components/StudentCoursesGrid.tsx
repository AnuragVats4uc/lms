import type { StudentCourseItem } from "@repo/types";
import { YStack } from "@repo/ui";

import { DataTablePagination } from "@/components/DataTable";
import { courseVisualVariants, PAGE_SIZE } from "../constants";
import { StudentCourseCard } from "./StudentCourseCard";

type StudentCoursesGridProps = {
  courses: StudentCourseItem[];
  onPageChange: (page: number) => void;
  page: number;
  total: number;
  totalPages: number;
};

export const StudentCoursesGrid = ({
  courses,
  onPageChange,
  page,
  total,
  totalPages,
}: StudentCoursesGridProps) => (
  <YStack className="student-course-list-stack">
    <div className="student-course-card-grid">
      {courses.map((course, index) => (
        <StudentCourseCard
          course={course}
          key={course.id}
          variant={courseVisualVariants[index % courseVisualVariants.length]}
        />
      ))}
    </div>
    <DataTablePagination
      page={page}
      pageSize={PAGE_SIZE}
      pageSizeOptions={[PAGE_SIZE]}
      pagination={{ entityLabel: "courses" }}
      setPage={onPageChange}
      setPageSize={() => onPageChange(1)}
      total={total}
      totalPages={totalPages}
    />
  </YStack>
);
