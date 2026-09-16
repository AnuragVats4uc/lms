import { Text, YStack } from "@repo/ui";

export const FolderContextEmptyState = () => (
  <YStack gap="$2" py="$5" style={{ alignItems: "center" }}>
    <Text color="#0F1D3A" fontWeight="$button">
      Select a session course
    </Text>
    <Text color="#52627A" fontSize="$caption">
      Choose an organization, session and course to manage its folders.
    </Text>
  </YStack>
);
