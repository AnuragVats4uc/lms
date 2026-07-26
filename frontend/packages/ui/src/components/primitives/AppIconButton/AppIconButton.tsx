"use client";

import { memo } from "react";
import { Button, styled } from "tamagui";

import type { AppIconButtonProps } from "./types";

const AppIconButtonFrame = styled(Button, {
  background: "$background",
  borderColor: "$borderColor",
  borderWidth: 1,
  height: "$4",
  minW: "$4",
  p: 0,
  rounded: "$3",

  hoverStyle: {
    background: "$backgroundHover",
    borderColor: "$green8",
  },

  focusStyle: {
    borderColor: "$green9",
  },
});

export const AppIconButton = memo(function AppIconButton({
  children,
  label,
  ...props
}: AppIconButtonProps) {
  return (
    <AppIconButtonFrame aria-label={label} {...props}>
      {children}
    </AppIconButtonFrame>
  );
});
