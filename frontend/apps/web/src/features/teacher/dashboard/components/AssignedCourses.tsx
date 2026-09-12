import { TeacherDashboardCourse } from "@repo/types";
import { AppCard, YStack } from "@repo/ui";
import { SectionHeader } from "./SectionHeader";
import { BookOpen } from "lucide-react";
import { CourseRow } from "./CourseRow";
import { EmptyText } from "./EmptyText";

export const AssignedCourses = ({
  courses,
}: {
  courses: TeacherDashboardCourse[];
}) => {
  return (
    <AppCard background="#FFFFFF" borderColor="#E1E7F0" rounded="$3">
      <YStack gap="$4">
        <SectionHeader
          icon={<BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />}
          subtitle="Course data is limited to your assigned session courses."
          title="Assigned Courses"
        />
        {courses.length ? (
          <YStack gap="$3">
            {courses.map((course) => (
              <CourseRow course={course} key={course.sessionCourseId} />
            ))}
          </YStack>
        ) : (
          <EmptyText text="No courses are assigned to this teacher account." />
        )}
      </YStack>
    </AppCard>
  );
};
