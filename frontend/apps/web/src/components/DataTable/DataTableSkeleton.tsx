"use client";

import { memo } from "react";
import { XStack, YStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";

interface DataTableSkeletonProps {
  columnCount: number;
  gridTemplateColumns?: string;
  rowCount?: number;
}

export const DataTableSkeleton = memo(
  ({
    columnCount,
    gridTemplateColumns,
    rowCount = 8,
  }: DataTableSkeletonProps) => {
    return (
      <YStack>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <XStack
            key={rowIndex}
            borderBottomColor={DATA_TABLE_COLORS.divider}
            borderBottomWidth={1}
            minH={64}
            minW="max-content"
            width="100%"
            style={{
              display: "grid",
              gridTemplateColumns:
                gridTemplateColumns ??
                `repeat(${columnCount}, minmax(140px, 1fr))`,
            }}
          >
            {Array.from({ length: columnCount }).map((__, columnIndex) => (
              <XStack
                key={columnIndex}
                px="$3"
                style={{ alignItems: "center" }}
              >
                <XStack
                  background={DATA_TABLE_COLORS.graySoft}
                  height={14}
                  width={columnIndex === 0 ? 132 : 92}
                  style={{
                    borderRadius: 8,
                  }}
                />
              </XStack>
            ))}
          </XStack>
        ))}
      </YStack>
    );
  },
);

DataTableSkeleton.displayName = "DataTableSkeleton";
