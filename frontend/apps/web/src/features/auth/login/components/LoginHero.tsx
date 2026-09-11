import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { styled, Text, XStack, YStack } from "@repo/ui";

import { PlatformVisual } from "./PlatformVisual";

export const LoginHero = () => (
  <HeroPanel className="lms-login-hero" style={heroPanelStyle}>
    <HeroCopy>
      <HeroKicker style={heroKickerStyle}>
        <ShieldCheck aria-hidden="true" size={16} strokeWidth={2.2} />
        <Text
          color="#047857"
          fontSize="$label"
          fontWeight="$button"
          lineHeight="$label"
        >
          Secure Learning Management Platform
        </Text>
      </HeroKicker>
      <HeroTitle className="lms-login-hero-title" style={heroTitleStyle}>
        One platform. Every learning experience.
      </HeroTitle>
      <HeroText className="lms-login-hero-text" style={heroTextStyle}>
        Access your LMS workspace securely to learn, teach, manage content, and
        keep your organization moving.
      </HeroText>
    </HeroCopy>

    <PlatformVisual />
  </HeroPanel>
);

const HeroPanel = styled(YStack, {
  flex: 1,
  minW: 0,
});

const heroPanelStyle = {
  gap: 18,
  maxWidth: 640,
} satisfies CSSProperties;

const HeroCopy = styled(YStack, {
  gap: "$3",
});

const HeroKicker = styled(XStack, {
  background: "rgba(255, 255, 255, 0.74)",
  borderColor: "#CFE7DD",
  borderWidth: 1,
  gap: "$2",
  px: "$3",
  py: "$2",
  rounded: "$10",
});

const heroKickerStyle = {
  alignItems: "center",
  alignSelf: "flex-start",
} satisfies CSSProperties;

const HeroTitle = styled(Text, {
  color: "#0F1D3A",
  fontSize: 42,
  fontWeight: "$heading",
  lineHeight: 48,

  $sm: {
    fontSize: 34,
    lineHeight: 40,
  },
});

const heroTitleStyle = {
  maxWidth: 620,
} satisfies CSSProperties;

const HeroText = styled(Text, {
  color: "#334155",
  fontSize: "$bodyLarge",
  fontWeight: "$body",
  lineHeight: "$bodyLarge",
});

const heroTextStyle = {
  maxWidth: 540,
} satisfies CSSProperties;
