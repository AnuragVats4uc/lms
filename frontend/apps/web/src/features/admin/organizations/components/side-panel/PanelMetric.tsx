import { Text, XStack } from "@repo/ui";

export interface PanelMetricProps {
  label: string;
  value: string;
}

export function PanelMetric({ label, value }: PanelMetricProps) {
  return (
    <XStack style={{ justifyContent: "space-between" }}>
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
}
