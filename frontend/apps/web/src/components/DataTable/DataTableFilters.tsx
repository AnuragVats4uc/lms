"use client";

import { memo } from "react";
import { Text, XStack } from "@repo/ui";
import type { DataTableFilter } from "./types";
import { DATA_TABLE_COLORS } from "./constants";

interface DataTableFiltersProps<TData> {
  filters: DataTableFilter<TData>[];
  setFilterValue: (id: string, value: unknown) => void;
}

function DataTableFiltersComponent<TData>({
  filters,
  setFilterValue,
}: DataTableFiltersProps<TData>) {
  if (!filters.length) {
    return null;
  }

  return (
    <XStack gap="$3" style={{ flexWrap: "wrap" }}>
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
              style={{
                alignItems: "center",
                borderColor: DATA_TABLE_COLORS.border,
                borderRadius: 10,
                borderWidth: 1,
                minHeight: 40,
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
                  style={{
                    background: "transparent",
                    border: 0,
                    color: DATA_TABLE_COLORS.text,
                    font: "inherit",
                    outline: "none",
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
                  style={{
                    background: "transparent",
                    border: 0,
                    color: DATA_TABLE_COLORS.text,
                    font: "inherit",
                    outline: "none",
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
}

export const DataTableFilters = memo(
  DataTableFiltersComponent
) as typeof DataTableFiltersComponent;
