import { Spinner, Text, YStack } from "@repo/ui";

export const StudentCoursesLoading = () => {
  return (
    <YStack className="student-courses-state">
      <Spinner color="#059669" size="large" />
      <Text>Loading courses...</Text>
    </YStack>
  );
};
