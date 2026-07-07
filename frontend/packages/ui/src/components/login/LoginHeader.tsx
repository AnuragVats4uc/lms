"use client";

import { styled, Text, View, XStack, YStack } from "tamagui";

export interface LoginHeaderProps {
  title?: string;
  subtitle?: string;
  brandLabel?: string;
}

export function LoginHeader({
  title = "Welcome back",
  subtitle = "Login to continue your learning journey",
  brandLabel = "The LMS",
}: LoginHeaderProps) {
  return (
    <HeaderStack>
      <BrandRow>
        <LogoMark role="img" aria-label={`${brandLabel} logo`}>
          <LogoCap />
          <LogoBase />
          <LogoTassel />
        </LogoMark>

        <BrandText>{brandLabel}</BrandText>
      </BrandRow>

      <TitleText>{title}</TitleText>

      <SubtitleText>{subtitle}</SubtitleText>
    </HeaderStack>
  );
}

const HeaderStack = styled(YStack, {
  gap: "$2",
  ...({
    alignItems: "center",
  } as any),
});

const BrandRow = styled(XStack, {
  gap: "$2",
  ...({
    alignItems: "center",
  } as any),
});

const LogoMark = styled(View, {
  height: 24,
  width: 32,
  ...({
    position: "relative",
  } as any),
});

const LogoCap = styled(View, {
  background: "#10B981",
  height: 14,
  rounded: 2,
  width: 24,
  ...({
    left: 4,
    position: "absolute",
    top: 4,
    transform: "rotate(45deg)",
  } as any),
});

const LogoBase = styled(View, {
  background: "#059669",
  height: 6,
  rounded: 3,
  width: 16,
  ...({
    left: 8,
    position: "absolute",
    top: 16,
  } as any),
});

const LogoTassel = styled(View, {
  background: "#047857",
  height: 10,
  width: 2,
  ...({
    left: 25,
    position: "absolute",
    top: 12,
  } as any),
});

const BrandText = styled(Text, {
  color: "#10B981",
  fontSize: "$h4",
  fontWeight: "$subheading",
  letterSpacing: "$heading",
});

const TitleText = styled(Text, {
  color: "#111827",
  fontSize: "$h4",
  fontWeight: "$subheading",
  letterSpacing: "$heading",
  ...({
    marginTop: 7,
    textAlign: "center",
  } as any),
});

const SubtitleText = styled(Text, {
  color: "#6B7280",
  fontSize: "$caption",
  fontWeight: "$caption",
  letterSpacing: "$body",
  ...({
    textAlign: "center",
  } as any),
});
