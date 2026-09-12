import { Button,Text, YStack } from "@repo/ui";
import { HelpCircle, RefreshCw } from "lucide-react";

export const StudentCoursesError = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <YStack className="student-courses-state">
      <HelpCircle color="#B42318" size={30} strokeWidth={2.1} />
      <Text>Unable to load courses</Text>
      <Button
        background="#059669"
        borderColor="#059669"
        borderWidth={1}
        height={36}
        onPress={onRetry}
        rounded="$3"
      >
        <RefreshCw aria-hidden="true" color="#FFFFFF" size={15} />
        <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
          Retry
        </Button.Text>
      </Button>
    </YStack>
  );
};