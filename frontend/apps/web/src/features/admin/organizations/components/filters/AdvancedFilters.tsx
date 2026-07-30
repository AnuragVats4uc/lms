"use client";

import { Button, Input, XStack, YStack } from "@repo/ui";

import { availabilityOptions } from "../../constants";
import type {
  AvailabilityFilter,
  OrganizationFiltersState,
} from "../../types";

export interface AdvancedFiltersProps {
  filters: OrganizationFiltersState;
  onAvailabilityToggle: (value: AvailabilityFilter) => void;
  onCreatedByChange: (value: string) => void;
  onUpdatedByChange: (value: string) => void;
}

export function AdvancedFilters({
  filters,
  onAvailabilityToggle,
  onCreatedByChange,
  onUpdatedByChange,
}: AdvancedFiltersProps) {
  return (
    <YStack className="lms-organization-advanced-filters" gap="$3">
      <XStack gap="$2" style={{ flexWrap: "wrap" }}>
        {availabilityOptions.map((option) => {
          const isSelected = filters.availability.includes(option.value);

          return (
            <Button
              aria-pressed={isSelected}
              background={isSelected ? "#DDF4E7" : "#FFFFFF"}
              borderColor={isSelected ? "#8DD3B0" : "#D8E1EC"}
              borderWidth={1}
              height={36}
              key={option.value}
              onPress={() => onAvailabilityToggle(option.value)}
              rounded="$6"
            >
              <Button.Text
                color={isSelected ? "#047857" : "#0F1D3A"}
                fontSize="$caption"
                fontWeight="$button"
              >
                {option.label}
              </Button.Text>
            </Button>
          );
        })}
      </XStack>

      <XStack gap="$3" style={{ flexWrap: "wrap" }}>
        <Input
          aria-label="Created by"
          borderColor="#D8E1EC"
          height={40}
          onChangeText={onCreatedByChange}
          placeholder="Created by"
          style={{ minWidth: 220 }}
          value={filters.createdBy}
        />
        <Input
          aria-label="Updated by"
          borderColor="#D8E1EC"
          height={40}
          onChangeText={onUpdatedByChange}
          placeholder="Updated by"
          style={{ minWidth: 220 }}
          value={filters.updatedBy}
        />
      </XStack>
    </YStack>
  );
}
