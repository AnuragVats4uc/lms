"use client";

import { memo } from "react";
import { Headphones } from "lucide-react";
import { Button, XStack, YStack } from "tamagui";

import { AppCard, AppText } from "../../primitives";
import type { SupportCardProps } from "./types";

export const HelpCard = memo(function HelpCard({
  actionLabel,
  description,
  onPress,
  title,
}: SupportCardProps) {
  return (
    <AppCard>
      <YStack gap="$3">
        <XStack gap="$3" style={{ alignItems: "center" }}>
          <Headphones aria-hidden="true" color="currentColor" size={24} />
          <AppText fontWeight="$button" tone="success">
            {title}
          </AppText>
        </XStack>
        <AppText tone="muted">{description}</AppText>
        <Button aria-label={actionLabel} onPress={onPress}>
          <Button.Text>{actionLabel}</Button.Text>
        </Button>
      </YStack>
    </AppCard>
  );
});
