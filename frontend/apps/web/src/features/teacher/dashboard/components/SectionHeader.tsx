import { Text, XStack, YStack } from "@repo/ui";
import { IconBubble } from "./IconBubble";

export const SectionHeader = ({
  icon,
  subtitle,
  title,
}: {
  icon?: React.ReactNode;
  subtitle?: string;
  title: string;
}) => {
  return (
    <YStack gap="$2">
      <XStack gap="$2" style={{ alignItems: "center" }}>
        {icon ? <IconBubble tone="green">{icon}</IconBubble> : null}
        <Text color="#0F1D3A" fontSize={18} fontWeight="$heading">
          {title}
        </Text>
      </XStack>
      {subtitle ? (
        <Text color="#52627A" fontSize={13}>
          {subtitle}
        </Text>
      ) : null}
    </YStack>
  );
};
