import { YStack } from "@repo/ui";

import type { StudentNotificationTone } from "../types";

export const IconBadge = ({ tone }: { tone: StudentNotificationTone }) => {
  const Icon = tone.Icon;

  return (
    <YStack
      className="student-feed-icon"
      style={{ backgroundColor: tone.background }}
    >
      <Icon aria-hidden="true" color={tone.color} size={22} strokeWidth={2.2} />
    </YStack>
  );
};
