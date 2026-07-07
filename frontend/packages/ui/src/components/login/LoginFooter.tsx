"use client";

import { Button, styled, Text, XStack } from "tamagui";

export interface LoginFooterProps {
  prompt?: string;
  registerLabel?: string;
  onRegisterPress?: () => void;
}

export function LoginFooter({
  prompt = "Don't have an account?",
  registerLabel = "Register",
  onRegisterPress,
}: LoginFooterProps) {
  return (
    <FooterRow>
      <PromptText>{prompt}</PromptText>

      <RegisterButton
        type="button"
        chromeless
        pressStyle={{ opacity: 0.72 }}
        onPress={onRegisterPress}
        aria-label={registerLabel}
      >
        <RegisterText>{registerLabel}</RegisterText>
      </RegisterButton>
    </FooterRow>
  );
}

const FooterRow = styled(XStack, {
  gap: "$1",
  ...({
    alignItems: "center",
    justifyContent: "center",
  } as any),
});

const PromptText = styled(Text, {
  color: "#111827",
  fontSize: "$caption",
  fontWeight: "$body",
  letterSpacing: "$body",
});

const RegisterButton = styled(Button, {
  height: 24,
  p: 0,
});

const RegisterText = styled(Text, {
  color: "#10B981",
  fontSize: "$caption",
  fontWeight: "$button",
  letterSpacing: "$button",
});
