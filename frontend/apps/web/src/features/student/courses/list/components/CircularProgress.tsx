import type { CourseVisualVariant } from "../types";

export const CircularProgress = ({
  value,
  variant,
}: {
  value: number;
  variant: CourseVisualVariant;
}) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`student-course-progress-ring ${variant}`}>
      <svg aria-hidden="true" height="56" viewBox="0 0 56 56" width="56">
        <circle className="track" cx="28" cy="28" r={radius} />
        <circle
          className="value"
          cx="28"
          cy="28"
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
};