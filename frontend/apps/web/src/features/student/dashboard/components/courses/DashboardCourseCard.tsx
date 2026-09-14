import { useRouter } from "next/navigation";
import { ChevronRight, UserRound } from "lucide-react";
import { Card, Text, XStack, YStack } from "@repo/ui";
import type { StudentDashboardCourse } from "@repo/types";

import type { StudentCourseVariant } from "../../types";
import { clampPercentage } from "../../utils/clampPercentage";

type DashboardCourseCardProps = {
  course: StudentDashboardCourse;
  variant: StudentCourseVariant;
};

export const DashboardCourseCard = ({
  course,
  variant,
}: DashboardCourseCardProps) => {
  const router = useRouter();
  const completion = clampPercentage(course.completionPercentage);

  return (
    <Card className="student-course-card">
      <YStack className={`student-course-icon ${variant}`}>
        <Text className="student-course-code">{course.shortCode}</Text>
      </YStack>
      <YStack className="student-course-copy">
        <Text className="student-course-title">{course.title}</Text>
        <XStack className="student-course-instructor">
          <UserRound
            aria-hidden="true"
            color="#647084"
            size={14}
            strokeWidth={2}
          />
          <Text className="student-course-instructor-text">
            {course.instructor}
          </Text>
        </XStack>
      </YStack>
      <YStack className="student-course-progress-area">
        <Text className="student-course-progress-label">
          {completion}% completed
        </Text>
        <YStack
          aria-label={`${course.title} ${completion}% complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={completion}
          className="student-course-progress-track"
          role="progressbar"
        >
          <YStack
            className="student-course-progress-fill"
            style={{ width: `${completion}%` }}
          />
        </YStack>
      </YStack>
      <button
        aria-label={`Continue ${course.title}`}
        className="student-course-button"
        onClick={() => router.push(course.continuePath)}
        type="button"
      >
        <span className="student-course-button-text">Continue</span>
        <ChevronRight
          aria-hidden="true"
          color="#059669"
          size={18}
          strokeWidth={2.4}
        />
      </button>
    </Card>
  );
};
