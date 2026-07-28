"use client";

import { memo } from "react";
import { XStack, YStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";

interface DataTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

export const DataTableSkeleton = memo(function DataTableSkeleton({
  columnCount,
  rowCount = 8,
}: DataTableSkeletonProps) {
  return (
    <YStack>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <XStack
          key={rowIndex}
          style={{
            borderBottomColor: DATA_TABLE_COLORS.divider,
            borderBottomWidth: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${columnCount}, minmax(140px, 1fr))`,
            minHeight: 58,
          }}
        >
          {Array.from({ length: columnCount }).map((__, columnIndex) => (
            <XStack key={columnIndex} px="$4" style={{ alignItems: "center" }}>
              <XStack
                style={{
                  backgroundColor: DATA_TABLE_COLORS.graySoft,
                  borderRadius: 8,
                  height: 14,
                  width: columnIndex === 0 ? 132 : 92,
                }}
              />
            </XStack>
          ))}
        </XStack>
      ))}
    </YStack>
  );
});
