"use client";

import { memo } from "react";
import { Inbox } from "lucide-react";
import { Text, XStack, YStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import type { DataTableEmptyState } from "./types";

interface DataTableEmptyProps {
  emptyState?: DataTableEmptyState;
}

export const DataTableEmpty = memo(({ emptyState }: DataTableEmptyProps) => {
  return (
    <YStack
      gap="$3"
      p="$8"
      justify="center"
      minH={280}
      style={{
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <XStack
        background={DATA_TABLE_COLORS.greenSoft}
        justify="center"
        width={54}
        height={54}
        style={{
          alignItems: "center",
          borderRadius: 999,
          color: DATA_TABLE_COLORS.green,
        }}
      >
        {emptyState?.icon ?? <Inbox aria-hidden="true" size={26} />}
      </XStack>
      <YStack gap="$1" style={{ alignItems: "center" }}>
        <Text
          color={DATA_TABLE_COLORS.text}
          fontSize="$label"
          fontWeight="$button"
        >
          {emptyState?.title ?? "No records found"}
        </Text>
        {emptyState?.description ? (
          <Text
            color={DATA_TABLE_COLORS.muted}
            fontSize="$caption"
            lineHeight="$caption"
          >
            {emptyState.description}
          </Text>
        ) : null}
      </YStack>
      <XStack gap="$3">
        {emptyState?.primaryAction}
        {emptyState?.secondaryAction}
      </XStack>
    </YStack>
  );
});

DataTableEmpty.displayName = "DataTableEmpty";
