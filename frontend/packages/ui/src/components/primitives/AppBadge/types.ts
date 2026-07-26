import type { TextProps } from "tamagui";

export type AppBadgeTone =
  | "green"
  | "blue"
  | "purple"
  | "orange"
  | "gray";

export interface AppBadgeProps extends TextProps {
  tone?: AppBadgeTone;
}
