import { Spinner, Text, YStack } from "@repo/ui";

export const DashboardLoadingState = () => (
  <YStack className="student-dashboard-state">
    <Spinner color="#059669" size="large" />
    <Text color="#52627A" fontSize="$body" lineHeight="$body">
      Loading student dashboard...
    </Text>
  </YStack>
);
