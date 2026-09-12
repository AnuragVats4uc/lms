import { CourseVisualVariant } from "../types";

export const CourseVisual = ({
  shortCode,
  title,
  variant,
}: {
  shortCode: string;
  title: string;
  variant: CourseVisualVariant;
}) => {
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
};