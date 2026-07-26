"use client";

import {
  cloneElement,
  isValidElement,
  memo,
  type ReactElement,
} from "react";
import { Button, XStack, YStack } from "tamagui";

import {
  AppBadge,
  AppCard,
  AppHeading,
  AppText,
} from "../../primitives";
import type { RoleCardProps } from "./types";

const roleTheme = {
  blue: { background: "#EAF2FF", badgeBackground: "#DBEAFE", color: "#2563EB" },
  gray: { background: "#F1F5F9", color: "#475569" },
  green: { background: "#DDF4E7", badgeBackground: "#DDF4E7", color: "#047857" },
  orange: { background: "#FFEDD5", badgeBackground: "#FFEDD5", color: "#EA580C" },
  purple: { background: "#EDE9FE", badgeBackground: "#EDE9FE", color: "#7C3AED" },
} as const;

export const RoleCard = memo(function RoleCard({
  actions = [],
  badge,
  badgeTone = "green",
  description,
  icon,
  permissions,
  role,
  ...props
}: RoleCardProps) {
  const theme = roleTheme[badgeTone] ?? roleTheme.green;
  const themedIcon = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ color?: string; size?: number }>, {
        color: theme.color,
        size: 34,
      })
    : icon;

  return (
    <AppCard
      className="lms-dashboard-role-card"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      {...props}
      style={{
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
        height: 128,
        minWidth: 0,
        ...(props.style as object),
      }}
    >
      <YStack
        style={{
          height: "100%",
          justifyContent: "space-between",
          minWidth: 0,
        }}
      >
        <XStack gap="$3" style={{ alignItems: "flex-start", minWidth: 0 }}>
          <XStack
            background={theme.background}
            height={50}
            rounded="$10"
            width={50}
            style={{ alignItems: "center", color: theme.color, justifyContent: "center" }}
          >
            {themedIcon}
          </XStack>
          <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
            <AppHeading
              level={3}
              fontSize={12}
              lineHeight={14}
              numberOfLines={1}
            >
              {role}
            </AppHeading>
            <AppText
              color="#52627A"
              fontSize={11}
              lineHeight={14}
              numberOfLines={3}
            >
              {description}
            </AppText>
          </YStack>
        </XStack>
        <XStack
          style={{
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
            minWidth: 0,
            paddingTop: 10,
          }}
        >
          <AppBadge
            background={"badgeBackground" in theme ? theme.badgeBackground : theme.background}
            color={theme.color}
            fontSize={10}
            lineHeight={12}
            px="$2"
            py="$1"
            style={{ whiteSpace: "nowrap" }}
          >
            {badge}
          </AppBadge>
          <XStack gap="$2" style={{ flexShrink: 0 }}>
            {actions.map((action) => (
              <Button
                key={action.label}
                aria-label={action.label}
                background="#FFFFFF"
                borderColor="#E1E7F0"
                borderWidth={1}
                height={32}
                onPress={action.onPress}
                px={action.label === "More" ? "$2.5" : "$4"}
                rounded="$3"
                style={{ minWidth: action.label === "More" ? 34 : 56 }}
              >
                {action.icon}
                {action.label === "More" ? null : (
                  <Button.Text color="#0F1D3A" fontSize="$caption" fontWeight="$label">
                    {action.label}
                  </Button.Text>
                )}
              </Button>
            ))}
          </XStack>
        </XStack>
      </YStack>
    </AppCard>
  );
});
