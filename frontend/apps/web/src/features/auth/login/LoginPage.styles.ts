import type { CSSProperties } from "react";
import { styled, XStack, YStack } from "@repo/ui";

export const LoginPageShellFrame = styled(YStack, {
  flex: 1,
  background: "linear-gradient(135deg, #F7FCFA 0%, #EEF8F4 48%, #E5F5EE 100%)",
  p: "$4",
  width: "100%",

  $sm: {
    p: "$3",
  },
});

export const loginPageShellStyle = {
  height: "100vh",
  maxHeight: "100vh",
  overflow: "hidden",
  position: "relative",
} satisfies CSSProperties;

export const LoginContent = styled(XStack, {
  flex: 1,
  width: "100%",
});

export const loginContentStyle = {
  alignItems: "center",
  flexDirection: "row",
  gap: 56,
  justifyContent: "space-between",
  margin: "0 auto",
  maxWidth: 1200,
  minHeight: 0,
  padding: "28px 0 0",
  position: "relative",
  width: "100%",
  zIndex: 1,
} satisfies CSSProperties;
