import { Text, XStack } from "@repo/ui";

export interface PanelMetricProps {
  label: string;
  value: string;
}

export const PanelMetric = ({ label, value }: PanelMetricProps) => {
  return (
    <XStack justify="space-between">
      <Text color="#52627A" fontSize="$caption">
        {label}
      </Text>
      <Text
        color="#0F1D3A"
        fontSize="$caption"
        fontWeight="$button"
        numberOfLines={1}
      >
        {value}
      </Text>
    </XStack>
  );
};
