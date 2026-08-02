"use client";

import { X } from "lucide-react";
import { Button, Text, XStack } from "@repo/ui";

import type { ActiveFilterChip } from "../../utils";

export interface ActiveFilterChipsProps {
  filters: ActiveFilterChip[];
  onClear: () => void;
  onRemove: (id: string) => void;
}

export const ActiveFilterChips = ({
  filters,
  onClear,
  onRemove,
}: ActiveFilterChipsProps) => {
  if (!filters.length) {
    return null;
  }

  return (
    <XStack gap="$2" flexWrap="wrap" style={{ alignItems: "center" }}>
      <Text color="#52627A" fontSize="$caption" fontWeight="$button">
        {filters.length} active filters
      </Text>
      {filters.map((filter) => (
        <Button
          aria-label={`Remove ${filter.label}`}
          background="#F8FBFD"
          borderColor="#D8E1EC"
          borderWidth={1}
          height={32}
          key={filter.id}
          onPress={() => onRemove(filter.id)}
          rounded="$6"
        >
          <Button.Text color="#0F1D3A" fontSize="$caption">
            {filter.label}
          </Button.Text>
          <X aria-hidden="true" color="#52627A" size={13} />
        </Button>
      ))}
      <Button chromeless height={32} onPress={onClear}>
        <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
          Clear all
        </Button.Text>
      </Button>
    </XStack>
  );
};
