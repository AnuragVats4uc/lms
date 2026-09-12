import { PageContainer, Spinner, YStack, Text } from "@repo/ui";

export const TeacherDashboardLoading = () => {
  return (
    <PageContainer>
      <YStack
        gap="$3"
        py="$8"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Spinner color="#059669" size="large" />
        <Text color="#52627A" fontSize={14}>
          Loading teacher dashboard...
        </Text>
      </YStack>
    </PageContainer>
  );
};

