import { Text, XStack, YStack } from "@repo/ui";
import { IconBubble } from "./IconBubble";

export const MiniMetric = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => {
  return (
    <XStack
      gap="$2"
      p="$2"
      rounded="$3"
      style={{
        alignItems: "center",
        backgroundColor: "#F8FBFD",
        borderColor: "#E7EEF5",
        borderWidth: 1,
      }}
    >
      <IconBubble tone="gray">{icon}</IconBubble>
      <YStack gap={1}>
        <Text color="#52627A" fontSize={12} fontWeight="$button">
          {label}
        </Text>
        <Text color="#0F1D3A" fontSize={17} fontWeight="$heading">
          {value}
        </Text>
      </YStack>
    </XStack>
  );
};