import { BookOpen } from "lucide-react";
import { AppEmptyState, Card, YStack } from "@repo/ui";
import type { StudentDashboardContentUpdate } from "@repo/types";

import { SectionHeader } from "../SectionHeader";
import { ContentUpdateItem } from "./ContentUpdateItem";

export const ContentUpdatesSection = ({
  updates,
}: {
  updates: StudentDashboardContentUpdate[];
}) => (
  <Card className="student-panel student-side-panel">
    <SectionHeader
      actionHref="/student/resources"
      actionLabel="View all"
      title="Content Updates"
    />
    <YStack className="student-feed-list">
      {updates.length ? (
        updates.map((item) => <ContentUpdateItem item={item} key={item.id} />)
      ) : (
        <AppEmptyState
          description="New resources and assignments will appear here."
          icon={<BookOpen color="#059669" size={28} strokeWidth={2.2} />}
          title="No updates"
        />
      )}
    </YStack>
  </Card>
);
