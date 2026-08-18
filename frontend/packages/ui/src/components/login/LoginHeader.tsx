"use client";

import { styled, Text, XStack, YStack } from "tamagui";

import { GraduationCap } from "./LoginIcons";

export interface LoginHeaderProps {
  title?: string;
  subtitle?: string;
  brandLabel?: string;
}

export function LoginHeader({
  title = "Welcome back",
  subtitle = "Sign in to continue to your workspace.",
  brandLabel = "The LMS",
}: LoginHeaderProps) {
  return (
    <HeaderStack>
      <BrandRow>
        <GraduationCap
          size={24}
          color="#10B981"
          strokeWidth={2.4}
        />

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
