"use client";

import {
  cloneElement,
  isValidElement,
  memo,
  type ReactElement,
} from "react";
import { ArrowRight } from "lucide-react";
import { Button, Text, XStack, YStack, styled } from "tamagui";

import { AppCard, AppText } from "../../primitives";
import type { StatCardProps } from "./types";

const iconColors = {
  blue: "#2563EB",
  green: "#059669",
  purple: "#7C3AED",
} as const;

const IconBubble = styled(XStack, {
  height: 52,
  rounded: "$4",
  width: 52,

  variants: {
    color: {
      blue: { background: "$blue3", color: "$blue10" },
      green: { background: "$green3", color: "$green10" },
      purple: { background: "$purple3", color: "$purple10" },
    },
  } as const,

  defaultVariants: {
    color: "green",
  },
});

export const StatCard = memo(function StatCard({
  color = "green",
  icon,
  link,
  loading = false,
  onPress,
  subtitle,
  title,
  trend,
  value,
  ...props
}: StatCardProps) {
  const themedIcon = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ color?: string }>, {
        color: iconColors[color],
      })
    : icon;

  return (
    <AppCard
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      {...props}
      style={{
        boxShadow: "0 8px 28px rgba(15, 23, 42, 0.04)",
        minHeight: 136,
        ...(props.style as object),
      }}
    >
      <YStack
        style={{
          height: "100%",
          justifyContent: "space-between",
        }}
      >
        <XStack gap="$3" style={{ alignItems: "center", minWidth: 0 }}>
          <IconBubble
            color={color}
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {themedIcon}
          </IconBubble>
          <YStack gap="$0.5" style={{ minWidth: 0 }}>
            <AppText
              tone="muted"
              fontSize="$caption"
              lineHeight="$caption"
            >
              {title}
            </AppText>
            <Text
              color="#0F1D3A"
              fontSize={28}
              fontWeight="$heading"
              lineHeight={30}
            >
              {loading ? "..." : value}
            </Text>
            <AppText
              color="#52627A"
              fontSize="$caption"
              lineHeight="$caption"
            >
              {subtitle}
            </AppText>
          </YStack>
        </XStack>
        {link ? (
          <Button
            aria-label={link}
            background="transparent"
            chromeless
            height={24}
            onPress={onPress}
            p={0}
          >
            <AppText
              tone="success"
              fontSize="$caption"
              fontWeight="$button"
              lineHeight="$caption"
            >
              {link}
            </AppText>
            <ArrowRight aria-hidden="true" color="#087F5B" size={14} />
          </Button>
        ) : null}
        {trend ? <AppText tone="muted">{trend}</AppText> : null}
      </YStack>
    </AppCard>
  );
});
