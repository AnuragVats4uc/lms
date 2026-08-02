import { Text, YStack } from "@repo/ui";

export interface PanelCountProps {
  label: string;
  value: number;
}

export const PanelCount = ({ label, value }: PanelCountProps) => {
  return (
    <YStack
      gap="$1"
      p="$2"
      background="#F8FBFD"
      borderColor="#E1E7F0"
      borderWidth={1}
      style={{
        borderRadius: 10,
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
};
