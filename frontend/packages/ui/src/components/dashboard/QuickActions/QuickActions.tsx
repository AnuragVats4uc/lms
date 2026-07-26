"use client";

import { memo } from "react";
import { Text, XStack, YStack } from "tamagui";

import { AppCard } from "../../primitives";
import { QuickActionButton } from "../QuickActionButton";
import type { QuickActionsProps } from "./types";

export const QuickActionsCard = memo(function QuickActionsCard({
  actions,
  icon,
  title,
  ...props
}: QuickActionsProps) {
  return (
    <AppCard
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      {...props}
      style={{
        boxShadow: "0 8px 28px rgba(15, 23, 42, 0.04)",
        minHeight: 136,
        ...(props.style as object),
      }}
    >
      <YStack
        gap="$3"
        style={{
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <XStack
          gap="$2"
          style={{ alignItems: "center", color: "#059669" }}
        >
          {icon}
          <Text
            color="#0F1D3A"
            fontSize="$label"
            fontWeight="$button"
            lineHeight="$label"
          >
            {title}
          </Text>
        </XStack>
        <XStack
          className="lms-dashboard-quick-actions-grid"
          gap="$3"
          style={{ alignItems: "stretch", width: "100%" }}
        >
          {actions.map((action) => (
            <QuickActionButton key={action.label} {...action} />
          ))}
        </XStack>
      </YStack>
    </AppCard>
  );
});
