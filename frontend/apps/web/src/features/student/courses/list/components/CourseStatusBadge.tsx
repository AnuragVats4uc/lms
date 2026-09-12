import { StudentCourseStatus } from "@repo/types";
import { CourseVisualVariant } from "../types";
import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react";

const statusLabels: Record<StudentCourseStatus, string> = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN PROGRESS",
  NOT_STARTED: "NOT STARTED",
};

const renderCourseStatusIcon = (status: StudentCourseStatus) => {
  const props = { "aria-hidden": true as const, size: 11, strokeWidth: 2.3 };
  if (status === "COMPLETED") return <CheckCircle2 {...props} />;
  if (status === "IN_PROGRESS") return <Clock3 {...props} />;
  return <CircleDashed {...props} />;
};

export const CourseStatusBadge = ({
  status,
  variant,
}: {
  status: StudentCourseStatus;
  variant: CourseVisualVariant;
}) => {
  return (
    <span
      className={`student-course-status-badge ${variant} ${status.toLowerCase()}`}
    >
      {renderCourseStatusIcon(status)}
      {statusLabels[status]}
    </span>
  );
};
