import { StudentCourseItem } from "@repo/types";
import { CourseVisualVariant } from "../types";
import { FileText, Trophy, Video } from "lucide-react";

const CourseResourceMetric = ({
  Icon,
  label,
  value,
}: {
  Icon: typeof Video;
  label: string;
  value: number;
}) => {
  return (
    <span className="student-course-resource-metric">
      <span>
        <Icon aria-hidden="true" size={12} strokeWidth={2.3} />
        <strong>{value}</strong>
      </span>
      <small>{label}</small>
    </span>
  );
};

export const CourseResourceSummary = ({
  counts,
  variant,
}: {
  counts: StudentCourseItem["resourceCounts"];
  variant: CourseVisualVariant;
}) => {
  return (
    <div className={`student-course-resource-summary ${variant}`}>
      <CourseResourceMetric Icon={Video} label="Videos" value={counts.videos} />
      <CourseResourceMetric
        Icon={FileText}
        label="Documents"
        value={counts.documents}
      />
      <CourseResourceMetric Icon={Trophy} label="Exams" value={counts.exams} />
    </div>
  );
};
