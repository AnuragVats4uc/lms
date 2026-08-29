"use client";

import { memo } from "react";
import { styled, YStack } from "tamagui";

import type { AppCardProps } from "./types";

const AppCardFrame = styled(YStack, {
  borderColor: "$borderColor",
  borderWidth: 1,
  overflow: "hidden",
  p: "$4",
  rounded: "$4",
  shadowColor: "$shadowColor",
  shadowOpacity: 0.04,
  shadowRadius: 10,

  variants: {
    interactive: {
      true: {
        cursor: "pointer",
        hoverStyle: {
          borderColor: "$green8",
          shadowOpacity: 0.1,
        },
        pressStyle: {
          scale: 0.99,
        },
      },
    },
  } as const,
});

export const AppCard = memo(function AppCard({
  background,
  children,
  interactive = false,
  ...props
}: AppCardProps) {
  const surfaceBackground = background ?? "#FFFFFF";

  return (
    <AppCardFrame
      background={surfaceBackground}
      interactive={interactive}
      {...props}
    >
      {children}
    </AppCardFrame>
  );
});
