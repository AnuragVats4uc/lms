import { StudentCourseItem } from "@repo/types";
import { CourseVisualVariant } from "../types";
import { Card, XStack, YStack, Text } from "@repo/ui";
import { useRouter } from "next/router";
import { Play } from "lucide-react";
import { CourseVisual } from "./CourseVisual";
import { CircularProgress } from "./CircularProgress";
import {  CourseProgressBar } from "./CourseProgressBar";
import { CourseResourceSummary } from "./CourseResourceSummary";
import { clampPercentage, formatRelativeTimestamp, getCompactActionLabel } from "../utils/courses.list.util";
import { CourseStatusBadge } from "./CourseStatusBadge";

export const StudentCourseCard = ({
  course,
  variant,
}: {
  course: StudentCourseItem;
  variant: CourseVisualVariant;
}) => {
  const router = useRouter();
  const progress = clampPercentage(course.completionPercentage);

  return (
    <Card className="student-course-panel-card">
      <XStack className="student-course-card-content">
        {course.image ? (
          <div
            aria-label={course.title}
            className="student-course-art"
            role="img"
            style={{ backgroundImage: `url("${course.image}")` }}
          />
        ) : (
          <CourseVisual
            shortCode={course.shortCode}
            title={course.title}
            variant={variant}
          />
        )}
        <YStack className="student-course-card-details">
          <XStack className="student-course-card-head">
            <div>
              <Text className="student-course-main-title" numberOfLines={1}>
                {course.title}
              </Text>
              <Text className="student-course-program" numberOfLines={1}>
                {course.program} • {course.instructor}
              </Text>
            </div>
            <CourseStatusBadge status={course.status} variant={variant} />
          </XStack>
          <Text className="student-course-description" numberOfLines={1}>
            {course.description ??
              "Course content assigned through your active batch."}
          </Text>
          <XStack className="student-course-stats-row">
            <CircularProgress value={progress} variant={variant} />
            <CourseProgressBar
              value={course.completionPercentage}
              variant={variant}
            />
          </XStack>
        </YStack>
      </XStack>
      <XStack className="student-course-card-footer">
        <CourseResourceSummary
          counts={course.resourceCounts}
          variant={variant}
        />
        <YStack className="student-course-last-accessed">
          <Text>Last accessed</Text>
          <XStack>
            <strong>
              {course.lastAccessed ? course.lastAccessed.title : "-"}
            </strong>
            {course.lastAccessed ? (
              <span>
                {formatRelativeTimestamp(course.lastAccessed.timestamp)}
              </span>
            ) : null}
          </XStack>
        </YStack>
        <button
          className={`student-course-continue-button ${variant}`}
          onClick={() => router.push(course.continuePath)}
          type="button"
        >
          <span>{getCompactActionLabel(course)}</span>
          <Play
            aria-hidden="true"
            fill="currentColor"
            size={14}
            strokeWidth={0}
          />
        </button>
      </XStack>
    </Card>
  );
};
