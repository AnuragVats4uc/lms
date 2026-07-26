"use client";

import { memo } from "react";
import { XStack, YStack, styled } from "tamagui";

import { AppHeading, AppText } from "../../primitives";
import type { SectionTitleProps } from "./types";

const SectionTitleFrame = styled(XStack, {
  gap: "$3",
});

export const SectionTitle = memo(function SectionTitle({
  action,
  description,
  title,
}: SectionTitleProps) {
  return (
    <SectionTitleFrame
      style={{
        alignItems: "flex-start",
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      <YStack gap="$1" style={{ flex: "1 1 280px", minWidth: 0 }}>
        <AppHeading level={2}>{title}</AppHeading>
        {description ? (
          <AppText
            color="#52627A"
            fontSize="$caption"
            lineHeight="$caption"
          >
            {description}
          </AppText>
        ) : null}
      </YStack>
      {action}
    </SectionTitleFrame>
  );
});
