"use client";

import { memo } from "react";
import { Text, styled } from "tamagui";

import type { AppTextProps } from "./types";

const AppTextFrame = styled(Text, {
  fontSize: "$label",
  letterSpacing: "$body",

  variants: {
    tone: {
      default: {
        color: "$color",
      },
      muted: {
        color: "$gray10",
      },
      success: {
        color: "$green10",
      },
    },
  } as const,

  defaultVariants: {
    tone: "default",
  },
});

export const AppText = memo(function AppText({
  children,
  tone = "default",
  ...props
}: AppTextProps) {
  return (
    <AppTextFrame tone={tone} {...props}>
      {children}
    </AppTextFrame>
  );
});
