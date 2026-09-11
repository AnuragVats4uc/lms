import type { CSSProperties } from "react";
import { styled, View } from "@repo/ui";

export const LoginBackground = () => (
  <>
    <BackgroundGridFrame aria-hidden style={backgroundGridStyle} />
    <BackgroundGlow aria-hidden style={topGlowStyle} />
    <BackgroundGlow aria-hidden style={bottomGlowStyle} />
  </>
);

const BackgroundGridFrame = styled(View, {
  opacity: 0.42,
});

const backgroundGridStyle = {
  backgroundImage:
    "linear-gradient(rgba(15, 29, 58, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 29, 58, 0.035) 1px, transparent 1px)",
  backgroundSize: "36px 36px",
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
} satisfies CSSProperties;

const BackgroundGlow = styled(View, {
  rounded: "$10",
});

const topGlowStyle = {
  background:
    "radial-gradient(circle, rgba(16, 185, 129, 0.18), transparent 62%)",
  height: 360,
  left: -90,
  position: "absolute",
  top: -130,
  width: 360,
} satisfies CSSProperties;

const bottomGlowStyle = {
  background:
    "radial-gradient(circle, rgba(37, 99, 235, 0.12), transparent 64%)",
  bottom: -150,
  height: 420,
  position: "absolute",
  right: -120,
  width: 420,
} satisfies CSSProperties;
