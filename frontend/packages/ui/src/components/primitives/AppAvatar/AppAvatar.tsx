"use client";

import { memo } from "react";
import { Avatar, Text, XStack, YStack, styled } from "tamagui";

import type { AppAvatarProps } from "./types";

const AvatarFrame = styled(XStack, {
  gap: "$3",
});

const AvatarFallback = styled(Avatar.Fallback, {
  background: "$green3",
});

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export const AppAvatar = memo(function AppAvatar({
  imageSrc,
  label,
  subtitle,
}: AppAvatarProps) {
  return (
    <AvatarFrame style={{ alignItems: "center", minWidth: 0, width: "100%" }}>
      {imageSrc ? (
        <Avatar circular size="$3.5">
          <Avatar.Image src={imageSrc} />
          <AvatarFallback>
            <Text color="$green10" fontWeight="$button">
              {getInitials(label)}
            </Text>
          </AvatarFallback>
        </Avatar>
      ) : (
        <XStack
          background="$green3"
          rounded="$10"
          style={{
            alignItems: "center",
            height: 34,
            justifyContent: "center",
            minHeight: 34,
            minWidth: 34,
            width: 34,
          }}
        >
          <Text color="$green10" fontSize="$label" fontWeight="$button">
            {getInitials(label)}
          </Text>
        </XStack>
      )}
      <YStack style={{ flex: 1, minWidth: 0 }}>
        <Text
          color="$color"
          fontSize="$label"
          fontWeight="$button"
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text color="$gray10" fontSize="$caption" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
    </AvatarFrame>
  );
});
