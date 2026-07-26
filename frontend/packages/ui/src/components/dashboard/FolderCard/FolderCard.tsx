"use client";

import { memo, useMemo } from "react";
import { Clock, FileText, Folder } from "lucide-react";
import { Button, Text, XStack, YStack, styled } from "tamagui";

import {
  AppBadge,
  AppCard,
  AppHeading,
  AppText,
} from "../../primitives";
import type { FolderCardProps } from "./types";

const folderTheme = {
  Documents: {
    badgeBackground: "#DBEAFE",
    badgeColor: "#2563EB",
    bubbleBackground: "#EAF2FF",
    iconColor: "#2563EB",
  },
  Exams: {
    badgeBackground: "#DDF4E7",
    badgeColor: "#047857",
    bubbleBackground: "#DDF4E7",
    iconColor: "#059669",
  },
  Videos: {
    badgeBackground: "#DDF4E7",
    badgeColor: "#047857",
    bubbleBackground: "#DDF4E7",
    iconColor: "#059669",
  },
} as const;

const IconBubble = styled(XStack, {
  height: 54,
  rounded: "$10",
  width: 54,
});

export const FolderCard = memo(function FolderCard({
  actions = [],
  badge,
  description,
  folderCount,
  icon,
  resourceCount,
  title,
  updatedAt,
  ...props
}: FolderCardProps) {
  const theme =
    folderTheme[title as keyof typeof folderTheme] ?? folderTheme.Exams;
  const metrics = useMemo(
    () => [
      {
        icon: <FileText aria-hidden="true" size={15} />,
        label: "Resources",
        value: resourceCount,
      },
      {
        icon: <Folder aria-hidden="true" size={15} />,
        label: "Sub-folders",
        value: folderCount,
      },
      {
        icon: <Clock aria-hidden="true" size={15} />,
        label: "Last updated",
        value: updatedAt,
      },
    ],
    [folderCount, resourceCount, updatedAt]
  );

  return (
    <AppCard
      className="lms-dashboard-folder-card"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      {...props}
      style={{
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        minHeight: 226,
        minWidth: 0,
        ...(props.style as object),
      }}
    >
      <YStack gap="$4" style={{ height: "100%", justifyContent: "space-between" }}>
        <XStack
          style={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <XStack gap="$3" style={{ alignItems: "center", minWidth: 0 }}>
            <IconBubble
              background={theme.bubbleBackground}
              style={{ alignItems: "center", color: theme.iconColor, justifyContent: "center" }}
            >
              {icon}
            </IconBubble>
            <AppHeading
              level={3}
              fontSize="$label"
              lineHeight="$label"
              numberOfLines={1}
            >
              {title}
            </AppHeading>
          </XStack>
          <AppBadge
            background={theme.badgeBackground}
            color={theme.badgeColor}
            fontSize="$caption"
            lineHeight="$caption"
          >
            {badge}
          </AppBadge>
        </XStack>
        <AppText color="#52627A" fontSize="$caption" lineHeight="$caption">
          {description}
        </AppText>
        <XStack
          borderColor="#E8EEF6"
          borderWidth={1}
          height={54}
          rounded="$3"
          style={{ alignItems: "center", minWidth: 0, overflow: "hidden" }}
        >
          {metrics.map((metric) => (
            <XStack
              flex={1}
              key={metric.label}
              gap="$1.5"
              style={{
                alignItems: "center",
                borderRightColor: metric.label === "Last updated" ? "transparent" : "#E8EEF6",
                borderRightWidth: metric.label === "Last updated" ? 0 : 1,
                justifyContent: "center",
                minWidth: 0,
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              <XStack style={{ color: "#059669" }}>{metric.icon}</XStack>
              <YStack style={{ minWidth: 0 }}>
                <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button" lineHeight="$caption">
                  {metric.value}
                </Text>
                <AppText
                  color="#52627A"
                  fontSize={10}
                  lineHeight={12}
                  numberOfLines={1}
                >
                  {metric.label}
                </AppText>
              </YStack>
            </XStack>
          ))}
        </XStack>
        <XStack
          className="lms-dashboard-folder-actions"
          gap="$2"
          style={{ minWidth: 0 }}
        >
          {actions.map((action) => (
            <Button
              key={action.label}
              aria-label={action.label}
              background="#FFFFFF"
              borderColor="#E1E7F0"
              borderWidth={1}
              color={action.label === "More" ? "#0F1D3A" : "#047857"}
              height={36}
              onPress={action.onPress}
              px={action.label === "More" ? "$3" : "$4"}
              rounded="$3"
              style={{ flex: action.label === "More" ? "0 0 auto" : 1 }}
            >
              {action.icon}
              {action.label === "More" ? null : (
                <Button.Text
                  color={action.label === "More" ? "#0F1D3A" : "#047857"}
                  fontSize="$caption"
                  fontWeight="$button"
                >
                  {action.label}
                </Button.Text>
              )}
            </Button>
          ))}
        </XStack>
      </YStack>
    </AppCard>
  );
});
