"use client";

import { memo } from "react";
import { YStack, styled } from "tamagui";

import { AppHeading } from "../AppHeading";
import { AppText } from "../AppText";
import type { AppEmptyStateProps } from "./types";

const EmptyFrame = styled(YStack, {
  gap: "$3",
  p: "$6",
});

export const AppEmptyState = memo(function AppEmptyState({
  action,
  description,
  icon,
  title,
}: AppEmptyStateProps) {
  return (
    <EmptyFrame style={{ alignItems: "center" }}>
      {icon}
      <AppHeading level={3}>{title}</AppHeading>
      <AppText tone="muted" style={{ textAlign: "center" }}>
        {description}
      </AppText>
      {action}
    </EmptyFrame>
  );
});
