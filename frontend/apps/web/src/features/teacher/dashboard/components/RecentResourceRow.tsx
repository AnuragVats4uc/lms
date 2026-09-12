import { TeacherDashboardRecentResource } from "@repo/types";
import { Text, XStack, YStack } from "@repo/ui";
import { IconBubble } from "./IconBubble";
import { FileText, Video } from "lucide-react";
import { Badge } from "./StatusBadge";

export const RecentResourceRow = ({
  resource,
}: {
  resource: TeacherDashboardRecentResource;
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
      <IconBubble
        tone={resource.resourceType.code === "VIDEO" ? "blue" : "green"}
      >
        {resource.resourceType.code === "VIDEO" ? (
          <Video aria-hidden="true" size={16} strokeWidth={2.2} />
        ) : (
          <FileText aria-hidden="true" size={16} strokeWidth={2.2} />
        )}
      </IconBubble>
      <YStack gap={3} style={{ flex: 1, minWidth: 0 }}>
        <Text color="#0F1D3A" fontSize={14} fontWeight="$heading">
          {resource.title}
        </Text>
        <Text color="#52627A" fontSize={12}>
          {resource.sessionCourse.title} / {resource.folder.name}
        </Text>
      </YStack>
      <Badge tone={resource.isPublished ? "green" : "gray"}>
        {resource.resourceType.code}
      </Badge>
    </XStack>
  );
};