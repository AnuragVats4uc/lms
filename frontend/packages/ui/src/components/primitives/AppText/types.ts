import type { TextProps } from "tamagui";

export type AppTextTone = "default" | "muted" | "success";

export interface AppTextProps extends TextProps {
  tone?: AppTextTone;
}
