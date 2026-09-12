import type { CourseVisualVariant } from "../types";
import { clampPercentage } from "../utils/courses.list.util";

export const CourseProgressBar = ({
  value,
  variant,
}: {
  value: number;
  variant: CourseVisualVariant;
}) => {
  const progress = clampPercentage(value);

  return (
    <div className={`student-course-progress-bar ${variant}`}>
      <div>
        <strong>{progress}%</strong>
        <span>Completed</span>
      </div>
      <span className="student-course-progress-track">
        <i style={{ width: `${progress}%` }} />
      </span>
    </div>
  );
};
