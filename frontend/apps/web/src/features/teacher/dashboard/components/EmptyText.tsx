import { Text, XStack, YStack } from "@repo/ui";

export const EmptyText = ({ text }: { text: string }) => {
  return (
    <Text color="#52627A" fontSize={13}>
      {text}
    </Text>
  );
};
