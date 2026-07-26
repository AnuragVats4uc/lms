"use client";

import { memo } from "react";
import { YStack, styled } from "tamagui";

import type { PageContainerProps } from "./types";

const PageContainerFrame = styled(YStack, {
  gap: "$4",
});

export const PageContainer = memo(function PageContainer({
  children,
}: PageContainerProps) {
  return <PageContainerFrame>{children}</PageContainerFrame>;
});
