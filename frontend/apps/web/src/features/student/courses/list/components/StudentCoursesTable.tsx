import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { StudentCourseItem } from "@repo/types";

import { DataTable } from "@/components/DataTable";
import { PAGE_SIZE } from "../constants";
import { createCourseColumns } from "../table/createCourseColumns";

const emptyState = {
  description: "Your assigned courses will appear here.",
  title: "No courses assigned yet",
};

type StudentCoursesTableProps = {
  courses: StudentCourseItem[];
  loading: boolean;
  onPageChange: (page: number) => void;
  page: number;
  total: number;
  totalPages: number;
};

export const StudentCoursesTable = ({
  courses,
  loading,
  onPageChange,
  page,
  total,
  totalPages,
}: StudentCoursesTableProps) => {
  const router = useRouter();
  const columns = useMemo(
    () => createCourseColumns((path) => router.push(path)),
    [router],
  );

  return (
    <div className="student-courses-table-view">
      <DataTable<StudentCourseItem>
        columns={columns}
        data={courses}
        emptyState={emptyState}
        getRowId={(course) => course.id}
        loading={loading}
        onPageChange={onPageChange}
        pagination={{
          entityLabel: "courses",
          mode: "server",
          page,
          pageSize: PAGE_SIZE,
          pageSizeOptions: [PAGE_SIZE],
          total,
          totalPages,
        }}
        renderToolbar={() => null}
        searchable={false}
        stickyFirstColumn
        stickyHeader
      />
    </div>
  );
};
