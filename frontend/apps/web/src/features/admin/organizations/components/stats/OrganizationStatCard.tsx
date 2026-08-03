"use client";

import { memo } from "react";
import { Text, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";

import type { CrudStat } from "../../../components/crud/types";
import { useAnimatedNumber } from "./AnimatedNumber";

export const OrganizationStatCard = memo(
  ({ icon, isLoading, label, value }: CrudStat & { isLoading: boolean }) => {
    const animatedValue = useAnimatedNumber(value, !isLoading);

    return (
      <AppCard
        className="lms-organization-stat-card"
        background="#FFFFFF"
        borderColor="#E1E7F0"
        p="$3"
        minH={88}
      >
        {isLoading ? (
          <YStack gap="$2">
            <XStack className="lms-skeleton" height={24} width={42} />
            <XStack className="lms-skeleton" height={12} width={120} />
          </YStack>
        ) : (
          <XStack gap="$3" style={{ alignItems: "center" }}>
            <XStack
              background="#EAF7F3"
              height={44}
              width={44}
              justify="center"
              style={{
                alignItems: "center",
                borderRadius: 12,
              }}
            >
              {icon}
            </XStack>
            <YStack gap="$1" minW={0}>
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
  },
);

OrganizationStatCard.displayName = "OrganizationStatCard";
