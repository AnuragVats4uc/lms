import { Text, YStack } from "@repo/ui";

export const TeacherHeader = () => {
  return (
    <YStack gap="$2">
      <Text color="#0F1D3A" fontSize={30} fontWeight="$heading">
        Teacher Dashboard
      </Text>
      <Text color="#52627A" fontSize="$label" lineHeight="$label">
        Your assigned courses, enrolled students, and learning resources.
      </Text>
    </YStack>
  );
};
