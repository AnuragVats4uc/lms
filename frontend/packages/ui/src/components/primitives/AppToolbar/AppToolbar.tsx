"use client";

import { memo } from "react";
import { XStack, styled } from "tamagui";

import type { AppToolbarProps } from "./types";

const AppToolbarFrame = styled(XStack, {
  gap: "$3",
});

export const AppToolbar = memo(function AppToolbar({
  children,
  ...props
}: AppToolbarProps) {
  return (
    <AppToolbarFrame
      style={{
        alignItems: "center",
        justifyContent: "space-between",
      }}
      {...props}
    >
      {children}
    </AppToolbarFrame>
  );
});
