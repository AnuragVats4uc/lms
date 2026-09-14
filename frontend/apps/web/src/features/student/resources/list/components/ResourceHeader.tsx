import { Text, YStack } from "@repo/ui";

export const ResourceHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  return (
    <YStack className="student-resources-heading">
      <Text className="student-resources-title">{title}</Text>
      <Text className="student-resources-subtitle">{subtitle}</Text>
    </YStack>
  );
};
