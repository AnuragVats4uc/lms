import { StudentCourseItem } from "@repo/types";
import { CourseVisualVariant } from "../types";
import { DataTableTextCell } from "@/components/DataTable";

export const CourseTableNameCell = ({
  course,
  variant,
}: {
  course: StudentCourseItem;
  variant: CourseVisualVariant;
}) => {
  return (
    <div className="student-course-table-name">
      <span className={`student-course-table-icon ${variant}`}>
        {course.shortCode}
      </span>
      <div>
        <DataTableTextCell
          primary={course.title}
          secondary={`${course.program} • ${course.instructor}`}
        />
      </div>
    </div>
  );
};