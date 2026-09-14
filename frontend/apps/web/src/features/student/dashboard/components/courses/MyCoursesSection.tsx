import { BookOpen } from "lucide-react";
import { AppEmptyState, Card, YStack } from "@repo/ui";
import type { StudentDashboardCourse } from "@repo/types";

import { courseVariants } from "../../constants/dashboardTheme";
import { SectionHeader } from "../SectionHeader";
import { DashboardCourseCard } from "./DashboardCourseCard";

export const MyCoursesSection = ({
  courses,
}: {
  courses: StudentDashboardCourse[];
}) => (
  <Card className="student-panel student-courses-panel">
    <SectionHeader
      actionHref="/student/my-courses"
      actionLabel="View all courses"
      title="My Courses"
    />
    {courses.length ? (
      <YStack className="student-courses-grid">
        {courses.map((course, index) => (
          <DashboardCourseCard
            course={course}
            key={course.id}
            variant={courseVariants[index % courseVariants.length]}
          />
        ))}
      </YStack>
    ) : (
      <AppEmptyState
        description="Your enrolled courses will appear here."
        icon={<BookOpen color="#059669" size={28} strokeWidth={2.2} />}
        title="No courses yet"
      />
    )}
  </Card>
);
