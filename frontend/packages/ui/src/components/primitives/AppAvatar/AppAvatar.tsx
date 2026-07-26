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

export const AppAvatar = memo(function AppAvatar({
  imageSrc,
  label,
  subtitle,
}: AppAvatarProps) {
  return (
    <AvatarFrame style={{ alignItems: "center" }}>
      <Avatar circular size="$3.5">
        {imageSrc ? <Avatar.Image src={imageSrc} /> : null}
        <AvatarFallback>
          <Text color="$green10" fontWeight="$button">
            {label.slice(0, 1)}
          </Text>
        </AvatarFallback>
      </Avatar>
      <YStack>
        <Text color="$color" fontSize="$label" fontWeight="$button">
          {label}
        </Text>
        {subtitle ? (
          <Text color="$gray10" fontSize="$caption">
            {subtitle}
          </Text>
        ) : null}
      </YStack>
    </AvatarFrame>
  );
});
