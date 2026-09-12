import { Button, PageContainer, Text, YStack } from "@repo/ui";
import { AlertCircle, RefreshCw } from "lucide-react";

export const TeacherDashboardError = ({ onPress }: { onPress: () => void }) => {
  return (
    <PageContainer>
      <YStack gap="$3" py="$8" style={{ alignItems: "center" }}>
        <AlertCircle color="#B91C1C" size={30} strokeWidth={2.2} />
        <Text color="#0F1D3A" fontSize={20} fontWeight="$heading">
          Unable to load dashboard
        </Text>
        <Text color="#52627A" fontSize={14}>
          Please try refreshing the teacher dashboard.
        </Text>
        <Button background="#059669" onPress={onPress} rounded="$3">
          <RefreshCw aria-hidden="true" color="#FFFFFF" size={16} />
          <Button.Text color="#FFFFFF" fontSize={13} fontWeight="$button">
            Retry
          </Button.Text>
        </Button>
      </YStack>
    </PageContainer>
  );
};
