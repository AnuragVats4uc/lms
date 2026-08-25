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
  const isTextValue = typeof value === "string";
  const isLongTextValue = isTextValue && value.length > 7;
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
        minHeight: 144,
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
              flexShrink: 0,
              justifyContent: "center",
            }}
          >
            {themedIcon}
          </IconBubble>
          <YStack
            gap="$0.5"
            style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden" }}
          >
            <AppText
              tone="muted"
              fontSize={11}
              lineHeight={13}
              numberOfLines={2}
            >
              {title}
            </AppText>
            <Text
              color="#0F1D3A"
              fontSize={isLongTextValue ? 21 : 26}
              fontWeight="$heading"
              lineHeight={isLongTextValue ? 24 : 28}
              numberOfLines={1}
              style={{ maxWidth: "100%" }}
            >
              {loading ? "..." : value}
            </Text>
            <AppText
              color="#52627A"
              fontSize={11}
              lineHeight={14}
              numberOfLines={2}
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
            height={34}
            onPress={onPress}
            p={0}
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: 0,
              width: "100%",
            }}
          >
            <AppText
              tone="success"
              fontSize="$caption"
              fontWeight="$button"
              lineHeight="$caption"
              numberOfLines={2}
              style={{ minWidth: 0, overflowWrap: "anywhere" }}
            >
              {link}
            </AppText>
            <ArrowRight
              aria-hidden="true"
              color="#087F5B"
              size={14}
              style={{ flexShrink: 0 }}
            />
          </Button>
        ) : null}
        {trend ? <AppText tone="muted">{trend}</AppText> : null}
      </YStack>
    </AppCard>
  );
});
