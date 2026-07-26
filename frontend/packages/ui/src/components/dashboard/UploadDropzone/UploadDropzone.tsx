"use client";

import { memo } from "react";
import { Button, XStack, YStack, styled } from "tamagui";

import { AppText } from "../../primitives";
import type { UploadDropzoneProps } from "./types";

const DropzoneFrame = styled(XStack, {
  background: "#FFFFFF",
  borderColor: "#B9C9E4",
  borderStyle: "dashed",
  borderWidth: 1,
  gap: "$4",
  height: 84,
  px: "$4",
  rounded: "$4",
});

export const UploadDropzone = memo(function UploadDropzone({
  actionLabel,
  description,
  icon,
  title,
}: UploadDropzoneProps) {
  return (
    <DropzoneFrame
      style={{
        alignItems: "center",
        overflow: "hidden",
        justifyContent: "space-between",
      }}
    >
      <XStack
        gap="$4"
        style={{ alignItems: "center", flex: "1 1 auto", minWidth: 0 }}
      >
        <XStack style={{ color: "#475569" }}>{icon}</XStack>
        <YStack gap="$1" style={{ minWidth: 0 }}>
          <AppText color="#0F1D3A" fontSize="$caption" fontWeight="$button" lineHeight="$caption">
            {title}
          </AppText>
          <AppText
            color="#52627A"
            fontSize="$caption"
            lineHeight="$caption"
            numberOfLines={2}
          >
            {description}
          </AppText>
        </YStack>
      </XStack>
      <Button
        background="#059669"
        height={40}
        px="$4"
        rounded="$3"
        aria-label={actionLabel}
        style={{ flexShrink: 0 }}
      >
        <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
          {actionLabel}
        </Button.Text>
      </Button>
    </DropzoneFrame>
  );
});
