"use client";

import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Text, XStack, YStack } from "@repo/ui";

import { DATA_TABLE_COLORS } from "./constants";
import type { DataTableErrorState } from "./types";

interface DataTableErrorProps {
  error: DataTableErrorState;
}

export const DataTableError = memo(function DataTableError({
  error,
}: DataTableErrorProps) {
  return (
    <YStack
      gap="$3"
      p="$8"
      style={{
        alignItems: "center",
        justifyContent: "center",
        minHeight: 280,
        textAlign: "center",
      }}
    >
      <XStack
        style={{
          alignItems: "center",
          backgroundColor: DATA_TABLE_COLORS.redSoft,
          borderRadius: 999,
          color: DATA_TABLE_COLORS.red,
          height: 54,
          justifyContent: "center",
          width: 54,
        }}
      >
        <AlertTriangle aria-hidden="true" size={26} />
      </XStack>
      <YStack gap="$1" style={{ alignItems: "center" }}>
        <Text
          color={DATA_TABLE_COLORS.text}
          fontSize="$label"
          fontWeight="$button"
        >
          {error.title ?? "Unable to load table data"}
        </Text>
        {error.description ? (
          <Text
            color={DATA_TABLE_COLORS.muted}
            fontSize="$caption"
            lineHeight="$caption"
          >
            {error.description}
          </Text>
        ) : null}
      </YStack>
      {error.onRetry ? (
        <Button
          aria-label={error.retryLabel ?? "Retry"}
          background={DATA_TABLE_COLORS.green}
          height={40}
          onPress={error.onRetry}
          rounded="$3"
        >
          <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
            {error.retryLabel ?? "Retry"}
          </Button.Text>
        </Button>
      ) : null}
    </YStack>
  );
});
