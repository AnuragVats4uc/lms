"use client";

import { memo } from "react";
import { YStack, styled } from "tamagui";

import type { AppSurfaceProps } from "./types";

const AppSurfaceFrame = styled(YStack, {
  background: "$background",
});

export const AppSurface = memo(function AppSurface({
  children,
  ...props
}: AppSurfaceProps) {
  return <AppSurfaceFrame {...props}>{children}</AppSurfaceFrame>;
});
