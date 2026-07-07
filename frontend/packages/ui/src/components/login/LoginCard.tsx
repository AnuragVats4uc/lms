"use client";

import {
  Button,
  Card,
  Separator,
  Spinner,
  styled,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { AppCheckbox } from "../checkbox/Checkbox";
import { AppInput } from "../input/Input";
import { PasswordInput } from "../input/PasswordInput";
import { LoginFooter, LoginFooterProps } from "./LoginFooter";
import { LoginHeader, LoginHeaderProps } from "./LoginHeader";

const LOGIN_SPACE = {
  cardPadding: 34,
  sectionGap: "$5",
  formGap: "$3",
  fieldGap: "$1.5",
  fieldPadding: "$2",
} as const;

export interface LoginCardProps {
  email?: string;
  password?: string;
  rememberMe?: boolean;
  isLoading?: boolean;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  rememberLabel?: string;
  forgotPasswordLabel?: string;
  loginLabel?: string;
  continueLabel?: string;
  headerProps?: LoginHeaderProps;
  footerProps?: LoginFooterProps;
  onEmailChange?: (value: string) => void;
  onPasswordChange?: (value: string) => void;
  onRememberMeChange?: (checked: boolean) => void;
  onLoginPress?: () => void;
  onForgotPasswordPress?: () => void;
}

export function LoginCard({
  email,
  password,
  rememberMe = false,
  isLoading = false,
  emailLabel = "Email address",
  emailPlaceholder = "Enter your email",
  passwordLabel = "Password",
  passwordPlaceholder = "Enter your password",
  rememberLabel = "Remember me",
  forgotPasswordLabel = "Forgot password?",
  loginLabel = "Login",
  continueLabel = "or continue with",
  headerProps,
  footerProps,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onLoginPress,
  onForgotPasswordPress,
}: LoginCardProps) {
  return (
    <LoginShell>
      <DecorativeCorners />

      <CardContent>
        <LoginHeader {...headerProps} />

        <FormStack>
          <FieldGroup>
            <FieldLabel>{emailLabel}</FieldLabel>
            <FieldFrame>
              <AppInput
                value={email}
                onChangeText={onEmailChange}
                placeholder={emailPlaceholder}
                aria-label={emailLabel}
                keyboardType="email-address"
                autoCapitalize="none"
                flex={1}
                height={26}
                borderWidth={0}
                background="transparent"
                color="#111827"
                fontSize="$label"
                fontWeight="$body"
                letterSpacing="$body"
                focusStyle={{
                  borderColor: "transparent",
                  outlineColor: "transparent",
                  outlineWidth: 0,
                }}
              />
            </FieldFrame>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>{passwordLabel}</FieldLabel>
            <FieldFrame>
              <PasswordInput
                value={password}
                onChangeText={onPasswordChange}
                placeholder={passwordPlaceholder}
                aria-label={passwordLabel}
                flex={1}
                height={26}
                borderWidth={0}
                background="transparent"
                color="#111827"
                fontSize="$label"
                fontWeight="$body"
                letterSpacing="$body"
                focusStyle={{
                  borderColor: "transparent",
                  outlineColor: "transparent",
                  outlineWidth: 0,
                }}
              />
            </FieldFrame>
          </FieldGroup>

          <ActionRow>
            <AppCheckbox
              id="login-remember-me"
              checked={rememberMe}
              label={rememberLabel}
              onCheckedChange={(checked) => {
                onRememberMeChange?.(checked === true);
              }}
            />

            <ForgotButton
              type="button"
              chromeless
              pressStyle={{ opacity: 0.72 }}
              onPress={onForgotPasswordPress}
              aria-label={forgotPasswordLabel}
            >
              <ForgotText>{forgotPasswordLabel}</ForgotText>
            </ForgotButton>
          </ActionRow>

          <LoginButton
            type="button"
            disabled={isLoading}
            background="#10B981"
            pressStyle={{ background: "#059669" }}
            hoverStyle={{ background: "#059669" }}
            onPress={onLoginPress}
            aria-label={loginLabel}
          >
            {isLoading ? (
              <Spinner color="white" size="small" />
            ) : (
              <LoginButtonText>{loginLabel}</LoginButtonText>
            )}
          </LoginButton>
        </FormStack>

        <DividerRow>
          <Separator flex={1} borderColor="#E5E7EB" />
          <DividerText>{continueLabel}</DividerText>
          <Separator flex={1} borderColor="#E5E7EB" />
        </DividerRow>

        <SocialRow>
          <GoogleButton />
          <MicrosoftButton />
        </SocialRow>

        <LoginFooter {...footerProps} />
      </CardContent>
    </LoginShell>
  );
}

const LoginShell = styled(Card, {
  background: "white",
  borderColor: "rgba(16, 185, 129, 0.16)",
  borderWidth: 1,
  overflow: "hidden",
  width: "100%",
  ...({
    borderRadius: 24,
    boxShadow: "0 24px 70px rgba(15, 118, 110, 0.22)",
    maxWidth: 420,
    minHeight: 600,
    paddingBottom: LOGIN_SPACE.cardPadding,
    paddingLeft: LOGIN_SPACE.cardPadding,
    paddingRight: LOGIN_SPACE.cardPadding,
    paddingTop: LOGIN_SPACE.cardPadding,
  } as any),
});

const CardContent = styled(YStack, {
  flex: 1,
  gap: LOGIN_SPACE.sectionGap,
  ...({
    justifyContent: "center",
    position: "relative",
    zIndex: 1,
  } as any),
});

const FormStack = styled(YStack, {
  gap: LOGIN_SPACE.formGap,
});

const FieldGroup = styled(YStack, {
  gap: LOGIN_SPACE.fieldGap,
});

const FieldLabel = styled(Text, {
  color: "#111827",
  fontSize: "$label",
  fontWeight: "$label",
  letterSpacing: "$body",
});

const FieldFrame = styled(XStack, {
  background: "white",
  borderColor: "#E5E7EB",
  borderWidth: 1,
  flexBasis: "auto",
  gap: "$2",
  height: 46,
  p: LOGIN_SPACE.fieldPadding,
  rounded: "$3",
  ...({
    alignItems: "center",
  } as any),
});

const ActionRow = styled(XStack, {
  ...({
    alignItems: "center",
    justifyContent: "space-between",
  } as any),
});

const ForgotButton = styled(Button, {
  height: 24,
  p: 0,
});

const ForgotText = styled(Text, {
  color: "#10B981",
  fontSize: "$caption",
  fontWeight: "$button",
  letterSpacing: "$button",
});

const LoginButton = styled(Button, {
  height: 48,
  rounded: "$3",
});

const LoginButtonText = styled(Text, {
  color: "white",
  fontSize: "$label",
  fontWeight: "$button",
  letterSpacing: "$button",
});

const DividerRow = styled(XStack, {
  gap: "$3",
  ...({
    alignItems: "center",
  } as any),
});

const DividerText = styled(Text, {
  color: "#9CA3AF",
  fontSize: "$caption",
  fontWeight: "$caption",
  letterSpacing: "$body",
});

const SocialRow = styled(XStack, {
  gap: "$4",
  ...({
    justifyContent: "center",
  } as any),
});

const SocialButton = styled(Button, {
  background: "white",
  borderColor: "#E5E7EB",
  borderWidth: 1,
  height: 46,
  rounded: 10,
  width: 58,
});

function GoogleButton() {
  return (
    <SocialButton
      type="button"
      aria-label="Continue with Google"
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{ borderColor: "#10B981" }}
    >
      <Text
        color="#4285F4"
        fontSize="$h4"
        fontWeight="$heading"
        letterSpacing="$heading"
      >
        G
      </Text>
    </SocialButton>
  );
}

function MicrosoftButton() {
  return (
    <SocialButton
      type="button"
      aria-label="Continue with Microsoft"
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{ borderColor: "#10B981" }}
    >
      <XStack flexWrap="wrap" width={20} height={20} gap={2}>
        <View width={9} height={9} background="#F25022" />
        <View width={9} height={9} background="#7FBA00" />
        <View width={9} height={9} background="#00A4EF" />
        <View width={9} height={9} background="#FFB900" />
      </XStack>
    </SocialButton>
  );
}

function DecorativeCorners() {
  return (
    <>
      <TopRightShape />
      <TopLeftLeaf />
      <TopLeftLeafSmall />
      <BottomLeftShape />
      <BottomRightShape />
    </>
  );
}

const TopRightShape = styled(View, {
  height: 84,
  opacity: 0.7,
  width: 118,
  ...({
    backgroundColor: "#CFF7EA",
    borderBottomLeftRadius: 76,
    position: "absolute",
    right: -26,
    top: -38,
  } as any),
});

const TopLeftLeaf = styled(View, {
  height: 18,
  opacity: 0.72,
  width: 28,
  ...({
    backgroundColor: "#10B981",
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    left: 14,
    position: "absolute",
    top: 18,
    transform: "rotate(-35deg)",
  } as any),
});

const TopLeftLeafSmall = styled(View, {
  height: 16,
  opacity: 0.72,
  width: 24,
  ...({
    backgroundColor: "#10B981",
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 16,
    left: 48,
    position: "absolute",
    top: 42,
    transform: "rotate(-35deg)",
  } as any),
});

const BottomLeftShape = styled(View, {
  height: 96,
  opacity: 0.78,
  width: 118,
  ...({
    backgroundColor: "#BDF4E5",
    borderTopRightRadius: 78,
    bottom: -30,
    left: -42,
    position: "absolute",
  } as any),
});

const BottomRightShape = styled(View, {
  height: 66,
  opacity: 0.62,
  width: 72,
  ...({
    backgroundColor: "#A7F3D0",
    borderTopLeftRadius: 58,
    bottom: -18,
    position: "absolute",
    right: -16,
  } as any),
});
