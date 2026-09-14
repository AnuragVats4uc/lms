import { Text, XStack, YStack } from "@repo/ui";

import { CrudSelect } from "@/features/shared/forms/CrudSelect";
import type { StudentCourseViewMode } from "../types";
import { ViewToggle } from "./ViewToggle";

type StudentCoursesHeaderProps = {
  category: string;
  categoryOptions: Array<{ label: string; value: string }>;
  isFetching: boolean;
  onCategoryChange: (value: string) => void;
  onViewModeChange: (value: StudentCourseViewMode) => void;
  viewMode: StudentCourseViewMode;
};

export const StudentCoursesHeader = ({
  category,
  categoryOptions,
  isFetching,
  onCategoryChange,
  onViewModeChange,
  viewMode,
}: StudentCoursesHeaderProps) => (
  <XStack className="student-courses-page-header">
    <YStack className="student-courses-title-block">
      <Text className="student-courses-page-title">My Courses</Text>
      <Text className="student-courses-page-subtitle">
        Continue your learning journey
      </Text>
    </YStack>
    <XStack className="student-courses-toolbar">
      <CrudSelect
        ariaLabel="Filter courses by category"
        label="Category"
        loading={isFetching}
        onChange={onCategoryChange}
        options={categoryOptions}
        value={category}
        width={170}
      />
      <ViewToggle value={viewMode} onChange={onViewModeChange} />
    </XStack>
  </XStack>
);
