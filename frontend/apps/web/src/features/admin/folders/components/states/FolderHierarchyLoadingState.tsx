import { Text, YStack } from "@repo/ui";

export const FolderHierarchyLoadingState = () => (
  <YStack gap="$2" py="$4">
    <Text color="#52627A" fontSize="$caption">
      Loading folder hierarchy…
    </Text>
  </YStack>
);
