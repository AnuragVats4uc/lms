import { TeacherDashboardRecentStudent } from "@repo/types";
import { Text, XStack, YStack } from "@repo/ui";
import { IconBubble } from "./IconBubble";
import { UserRound } from "lucide-react";

export const RecentStudentRow = ({
  student,
}: {
  student: TeacherDashboardRecentStudent;
}) => {
  return (
    <XStack
      gap="$3"
      p="$3"
      rounded="$3"
      style={{
        alignItems: "center",
        backgroundColor: "#FCFDFD",
        borderColor: "#E7EEF5",
        borderWidth: 1,
      }}
    >
      <IconBubble tone="blue">
        <UserRound aria-hidden="true" size={16} strokeWidth={2.2} />
      </IconBubble>
      <YStack gap={3} style={{ flex: 1, minWidth: 0 }}>
        <Text color="#0F1D3A" fontSize={14} fontWeight="$heading">
          {student.name}
        </Text>
        <Text color="#52627A" fontSize={12}>
          {student.studentCode} / {student.sessionCourse.title}
        </Text>
      </YStack>
    </XStack>
  );
};