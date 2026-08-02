"use client";

import { X } from "lucide-react";
import { Button, Text, XStack } from "@repo/ui";

import type { CrudFilterDefinition } from "./types";

export interface CrudActiveFilterChipsProps {
  filters: CrudFilterDefinition[];
  onClear: () => void;
  onRemove: (id: string) => void;
  values: Record<string, string>;
}

export const CrudActiveFilterChips = ({
  filters,
  onClear,
  onRemove,
  values,
}: CrudActiveFilterChipsProps) => {
  const active = filters
    .map((filter) => ({
      filter,
      option: filter.options.find(
        (option) => option.value === values[filter.id],
      ),
    }))
    .filter(
      ({ option }) => option && option.value !== "ALL" && option.value !== "",
    );

  if (!active.length) return null;

  return (
    <XStack gap="$2" flexWrap="wrap" style={{ alignItems: "center" }}>
      <Text color="#52627A" fontSize="$caption" fontWeight="$button">
        {active.length} active filters
      </Text>
      {active.map(({ filter, option }) => (
        <Button
          aria-label={`Remove ${filter.label} filter`}
          background="#F8FBFD"
          borderColor="#D8E1EC"
          borderWidth={1}
          height={32}
          key={filter.id}
          onPress={() => onRemove(filter.id)}
          rounded="$6"
        >
          <Button.Text color="#0F1D3A" fontSize="$caption">
            {filter.label}: {option?.label}
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
