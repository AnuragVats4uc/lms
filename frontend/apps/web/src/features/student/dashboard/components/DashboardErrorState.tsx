import { AlertCircle, RefreshCw } from "lucide-react";
import { Button, Text, YStack } from "@repo/ui";

export const DashboardErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <YStack className="student-dashboard-state">
    <AlertCircle color="#B91C1C" size={30} strokeWidth={2.2} />
    <Text color="#172033" fontSize="$h4" fontWeight="$heading" lineHeight="$h4">
      Unable to load dashboard
    </Text>
    <Text color="#647084" fontSize="$body" lineHeight="$body">
      Please try refreshing the student dashboard.
    </Text>
    <Button background="#059669" onPress={onRetry} rounded="$3">
      <RefreshCw aria-hidden="true" color="#FFFFFF" size={16} />
      <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
        Retry
      </Button.Text>
    </Button>
  </YStack>
);
