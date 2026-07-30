import { Text, YStack } from "@repo/ui";

export interface PanelCountProps {
  label: string;
  value: number;
}

export function PanelCount({ label, value }: PanelCountProps) {
  return (
    <YStack
      gap="$1"
      p="$2"
      style={{
        backgroundColor: "#F8FBFD",
        borderColor: "#E1E7F0",
        borderRadius: 10,
        borderWidth: 1,
        flex: "1 1 45%",
      }}
    >
      <Text color="#0F1D3A" fontSize="$label" fontWeight="$heading">
        {value}
      </Text>
      <Text color="#52627A" fontSize={11}>
        {label}
      </Text>
    </YStack>
  );
}
