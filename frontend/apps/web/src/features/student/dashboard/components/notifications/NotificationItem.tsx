import { Text, XStack, YStack } from "@repo/ui";
import type { StudentDashboardNotification } from "@repo/types";

import { notificationIconTones } from "../../constants/dashboardTheme";
import { formatRelativeTimestamp } from "../../utils/formatRelativeTimestamp";
import { IconBadge } from "../IconBadge";

export const NotificationItem = ({
  item,
}: {
  item: StudentDashboardNotification;
}) => (
  <XStack className="student-feed-item">
    <IconBadge tone={notificationIconTones[item.type]} />
    <YStack className="student-feed-copy">
      <Text className="student-feed-title">{item.title}</Text>
      <Text className="student-feed-description">{item.description}</Text>
    </YStack>
    <YStack className="student-feed-meta">
      <Text className="student-feed-time">
        {formatRelativeTimestamp(item.timestamp)}
      </Text>
      {!item.isRead ? (
        <YStack
          aria-label="Unread notification"
          className="student-unread-dot"
        />
      ) : null}
    </YStack>
  </XStack>
);
