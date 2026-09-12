import { TeacherDashboardCourse } from "@repo/types";
import { Text, XStack, YStack } from "@repo/ui";
import { BookOpen, FileText, Folder, UsersRound } from "lucide-react";
import { IconBubble } from "./IconBubble";
import { Badge } from "./StatusBadge";
import { MiniMetric } from "./MiniMetric";

export const CourseRow = ({ course }: { course: TeacherDashboardCourse }) => {
  return (
    <YStack
      gap="$3"
      style={{
        border: "1px solid #DFE6EE",
        borderRadius: 8,
        padding: 14,
      }}
    >
      <XStack
        gap="$3"
        style={{
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <YStack gap="$1" style={{ minWidth: 0 }}>
          <XStack gap="$2" style={{ alignItems: "center", minWidth: 0 }}>
            <IconBubble tone="green">
              <BookOpen aria-hidden="true" size={16} strokeWidth={2.2} />
            </IconBubble>
            <YStack gap={2} style={{ minWidth: 0 }}>
              <Text color="#0F1D3A" fontSize={16} fontWeight="$heading">
                {course.title}
              </Text>
              <Text color="#52627A" fontSize={13}>
                {course.session.name}
              </Text>
            </YStack>
          </XStack>
        </YStack>
        <Badge tone={course.isPublished ? "green" : "gray"}>
          {course.isPublished ? "Published" : "Draft"}
        </Badge>
      </XStack>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        }}
      >
        <MiniMetric
          icon={<UsersRound aria-hidden="true" size={15} strokeWidth={2.2} />}
          label="Students"
          value={course.enrolledStudents}
        />
        <MiniMetric
          icon={<Folder aria-hidden="true" size={15} strokeWidth={2.2} />}
          label="Folders"
          value={course.folders}
        />
        <MiniMetric
          icon={<FileText aria-hidden="true" size={15} strokeWidth={2.2} />}
          label="Resources"
          value={course.resources}
        />
      </div>

      <XStack gap="$2" style={{ flexWrap: "wrap" }}>
        {Object.entries(course.resourceTypes).map(([label, value]) => (
          <Badge key={label} tone="blue">
            {label}: {value}
          </Badge>
        ))}
      </XStack>
    </YStack>
  );
};
