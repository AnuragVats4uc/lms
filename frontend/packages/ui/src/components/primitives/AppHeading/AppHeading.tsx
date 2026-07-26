"use client";

import { memo } from "react";
import { Text, styled } from "tamagui";

import type { AppHeadingProps } from "./types";

const AppHeadingFrame = styled(Text, {
  color: "$color",
  fontWeight: "$heading",
  letterSpacing: "$heading",

  variants: {
    level: {
      1: {
        fontSize: "$h3",
        lineHeight: "$h3",
      },
      2: {
        fontSize: "$h4",
        lineHeight: "$h4",
      },
      3: {
        fontSize: "$bodyLarge",
        lineHeight: "$bodyLarge",
      },
    },
  } as const,

  defaultVariants: {
    level: 2,
  },
});

export const AppHeading = memo(function AppHeading({
  children,
  level = 2,
  ...props
}: AppHeadingProps) {
  return (
    <AppHeadingFrame level={level} {...props}>
      {children}
    </AppHeadingFrame>
  );
});
