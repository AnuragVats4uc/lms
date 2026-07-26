"use client";

import { memo } from "react";
import { Text, styled } from "tamagui";

import type { AppBadgeProps } from "./types";

const AppBadgeFrame = styled(Text, {
  fontSize: "$caption",
  fontWeight: "$button",
  letterSpacing: "$button",
  px: "$2",
  py: "$1",
  rounded: "$3",

  variants: {
    tone: {
      blue: {
        background: "$blue3",
        color: "$blue10",
      },
      gray: {
        background: "$gray3",
        color: "$gray10",
      },
      green: {
        background: "$green3",
        color: "$green10",
      },
      orange: {
        background: "$orange3",
        color: "$orange10",
      },
      purple: {
        background: "$purple3",
        color: "$purple10",
      },
    },
  } as const,

  defaultVariants: {
    tone: "green",
  },
});

export const AppBadge = memo(function AppBadge({
  children,
  tone = "green",
  ...props
}: AppBadgeProps) {
  return (
    <AppBadgeFrame tone={tone} {...props}>
      {children}
    </AppBadgeFrame>
  );
});
