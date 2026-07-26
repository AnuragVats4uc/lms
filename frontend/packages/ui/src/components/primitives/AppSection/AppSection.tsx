"use client";

import { memo } from "react";
import { YStack, styled } from "tamagui";

import type { AppSectionProps } from "./types";

const AppSectionFrame = styled(YStack, {
  gap: "$4",
});

export const AppSection = memo(function AppSection({
  children,
  ...props
}: AppSectionProps) {
  return <AppSectionFrame {...props}>{children}</AppSectionFrame>;
});
