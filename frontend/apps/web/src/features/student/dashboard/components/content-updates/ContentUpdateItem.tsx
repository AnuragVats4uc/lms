import { useRouter } from "next/navigation";
import { Text, XStack, YStack } from "@repo/ui";
import type { StudentDashboardContentUpdate } from "@repo/types";

import { contentUpdateIconTones } from "../../constants/dashboardTheme";
import { formatRelativeTimestamp } from "../../utils/formatRelativeTimestamp";
import { IconBadge } from "../IconBadge";

export const ContentUpdateItem = ({
  item,
}: {
  item: StudentDashboardContentUpdate;
}) => {
  const router = useRouter();

  return (
    <XStack
      className="student-feed-item student-update-item"
      onPress={() => router.push(item.path)}
      role="button"
    >
      <IconBadge tone={contentUpdateIconTones[item.resourceType.code]} />
      <YStack className="student-feed-copy">
        <Text className="student-feed-title">{item.title}</Text>
        <Text className="student-feed-description">{item.description}</Text>
      </YStack>
      <Text className="student-feed-time">
        {formatRelativeTimestamp(item.timestamp)}
      </Text>
    </XStack>
  );
};
