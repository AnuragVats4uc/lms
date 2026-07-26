"use client";

import { memo } from "react";
import { XStack, YStack, styled } from "tamagui";

import { AppText } from "../AppText";
import type { AppStatProps } from "./types";

const AppStatFrame = styled(XStack, {
  gap: "$2",
});

export const AppStat = memo(function AppStat({
  icon,
  label,
  value,
}: AppStatProps) {
  return (
    <AppStatFrame style={{ alignItems: "center" }}>
      {icon}
      <YStack>
        <AppText fontWeight="$button">{value}</AppText>
        <AppText tone="muted" fontSize="$caption">
          {label}
        </AppText>
      </YStack>
    </AppStatFrame>
  );
});
