"use client";

import { memo, type MemoExoticComponent } from "react";
import { Separator } from "tamagui";

import type { AppDividerProps } from "./types";

function AppDividerComponent(
  props: AppDividerProps
) {
  return <Separator borderColor="$borderColor" {...props} />;
}

export const AppDivider: MemoExoticComponent<
  typeof AppDividerComponent
> = memo(AppDividerComponent);
