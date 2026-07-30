"use client";

import { memo } from "react";
import { Text, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";

import type { OrganizationStat } from "../../types";
import { useAnimatedNumber } from "./AnimatedNumber";

export const OrganizationStatCard = memo(function OrganizationStatCard({
  icon,
  isLoading,
  label,
  value,
}: OrganizationStat & { isLoading: boolean }) {
  const animatedValue = useAnimatedNumber(value, !isLoading);

  return (
    <AppCard
      className="lms-organization-stat-card"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$3"
      style={{
        borderRadius: 14,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.035)",
        minHeight: 88,
      }}
    >
      {isLoading ? (
        <YStack gap="$2">
          <XStack className="lms-skeleton" style={{ height: 24, width: 42 }} />
          <XStack className="lms-skeleton" style={{ height: 12, width: 120 }} />
        </YStack>
      ) : (
        <XStack gap="$3" style={{ alignItems: "center" }}>
          <XStack
            style={{
              alignItems: "center",
              backgroundColor: "#EAF7F3",
              borderRadius: 12,
              height: 44,
              justifyContent: "center",
              width: 44,
            }}
          >
            {icon}
          </XStack>
          <YStack gap="$1" style={{ minWidth: 0 }}>
            <Text color="#0F1D3A" fontSize={22} fontWeight="$heading">
              {animatedValue}
            </Text>
            <Text color="#52627A" fontSize="$caption" numberOfLines={1}>
              {label}
            </Text>
          </YStack>
        </XStack>
      )}
    </AppCard>
  );
});
