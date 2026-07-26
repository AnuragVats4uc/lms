"use client";

import { memo } from "react";
import { Button, YStack, styled } from "tamagui";

import { AppText } from "../../primitives";
import type { QuickActionButtonProps } from "./types";

const QuickButton = styled(Button, {
  background: "#FFFFFF",
  borderColor: "#E1E7F0",
  borderWidth: 1,
  color: "#059669",
  flex: 1,
  height: 76,
  minW: 0,
  px: "$2",
  rounded: "$4",
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.02,
  shadowRadius: 8,

  hoverStyle: {
    borderColor: "#10B981",
  },

  variants: {
    variant: {
      default: {},
      primary: {
        background: "$green3",
      },
    },
  } as const,
});

export const QuickActionButton = memo(function QuickActionButton({
  disabled,
  icon,
  label,
  loading,
  onPress,
  variant = "default",
}: QuickActionButtonProps) {
  return (
    <QuickButton
      aria-label={label}
      disabled={disabled || loading}
      onPress={onPress}
      variant={variant}
    >
      <YStack
        gap="$2"
        style={{
          alignItems: "center",
          justifyContent: "center",
          minWidth: 0,
          width: "100%",
        }}
      >
        {icon}
        <AppText
          tone="success"
          fontSize={10}
          fontWeight="$button"
          lineHeight={12}
          numberOfLines={2}
          style={{
            maxWidth: "100%",
            overflowWrap: "break-word",
            textAlign: "center",
            whiteSpace: "normal",
          }}
        >
          {loading ? "Loading..." : label}
        </AppText>
      </YStack>
    </QuickButton>
  );
});
