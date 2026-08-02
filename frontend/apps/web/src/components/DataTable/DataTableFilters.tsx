"use client";

import { memo } from "react";
import { Text, XStack } from "@repo/ui";
import type { DataTableFilter } from "./types";
import { DATA_TABLE_COLORS } from "./constants";

interface DataTableFiltersProps<TData> {
  filters: DataTableFilter<TData>[];
  setFilterValue: (id: string, value: unknown) => void;
}

const DataTableFiltersComponent = <TData,>({
  filters,
  setFilterValue,
}: DataTableFiltersProps<TData>) => {
  if (!filters.length) {
    return null;
  }

  return (
    <XStack gap="$3" flexWrap="wrap">
      {filters.map((filter) => {
        if (filter.render) {
          return (
            <XStack key={filter.id}>
              {filter.render({ filter, setFilterValue })}
            </XStack>
          );
        }

        return (
          <label key={filter.id}>
            <XStack
              gap="$2"
              px="$3"
              borderColor={DATA_TABLE_COLORS.border}
              borderWidth={1}
              minH={40}
              style={{
                alignItems: "center",
                borderRadius: 10,
              }}
            >
              <Text
                color={DATA_TABLE_COLORS.muted}
                fontSize="$caption"
                lineHeight="$caption"
              >
                {filter.label}
              </Text>
              {filter.options?.length ? (
                <select
                  aria-label={filter.label}
                  onChange={(event) =>
                    setFilterValue(filter.id, event.target.value)
                  }
                  className="border-0 outlin-0"
                  style={{
                    background: "transparent",
                    color: DATA_TABLE_COLORS.text,
                    font: "inherit",
                  }}
                  value={String(filter.value ?? "")}
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label={filter.label}
                  onChange={(event) =>
                    setFilterValue(filter.id, event.target.value)
                  }
                  className="border-0 outline-0"
                  style={{
                    background: "transparent",
                    color: DATA_TABLE_COLORS.text,
                    font: "inherit",
                    width: 140,
                  }}
                  value={String(filter.value ?? "")}
                />
              )}
            </XStack>
          </label>
        );
      })}
    </XStack>
  );
};

export const DataTableFilters = memo(
  DataTableFiltersComponent,
) as typeof DataTableFiltersComponent;
