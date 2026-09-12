import { Grid3X3, List } from "lucide-react";
import { StudentCourseViewMode } from "../types";

export const ViewToggle = ({
  onChange,
  value,
}: {
  onChange: (value: StudentCourseViewMode) => void;
  value: StudentCourseViewMode;
}) => {
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
};
