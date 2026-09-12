import { TeacherDashboardRecentResource } from "@repo/types";
import { AppCard, YStack } from "@repo/ui";
import { FileText } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { RecentResourceRow } from "./RecentResourceRow";
import { EmptyText } from "./EmptyText";

export const RecentResources = ({
  resources,
}: {
  resources: TeacherDashboardRecentResource[];
}) => {
  return (
    <AppCard background="#FFFFFF" borderColor="#E1E7F0" rounded="$3">
      <YStack gap="$4">
        <SectionHeader
          icon={<FileText aria-hidden="true" size={18} strokeWidth={2.2} />}
          title="Recent Resources"
        />
        {resources.length ? (
          <YStack gap="$2">
            {resources.map((resource) => (
              <RecentResourceRow key={resource.id} resource={resource} />
            ))}
          </YStack>
        ) : (
          <EmptyText text="No resources available for assigned courses." />
        )}
      </YStack>
    </AppCard>
  );
};
