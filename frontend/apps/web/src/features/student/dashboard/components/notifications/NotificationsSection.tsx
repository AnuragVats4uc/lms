import { GraduationCap } from "lucide-react";
import { AppEmptyState, Card, YStack } from "@repo/ui";
import type { StudentDashboardNotification } from "@repo/types";

import { SectionHeader } from "../SectionHeader";
import { NotificationItem } from "./NotificationItem";

export const NotificationsSection = ({
  notifications,
}: {
  notifications: StudentDashboardNotification[];
}) => (
  <Card className="student-panel student-side-panel">
    <SectionHeader
      actionHref="/student/notifications"
      actionLabel="View all"
      title="Notifications"
    />
    <YStack className="student-feed-list">
      {notifications.length ? (
        notifications.map((item) => (
          <NotificationItem item={item} key={item.id} />
        ))
      ) : (
        <AppEmptyState
          description="You are all caught up."
          icon={<GraduationCap color="#059669" size={28} strokeWidth={2.2} />}
          title="No notifications"
        />
      )}
    </YStack>
  </Card>
);
