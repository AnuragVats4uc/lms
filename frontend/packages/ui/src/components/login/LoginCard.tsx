"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CSSProperties,
  MouseEvent,
  memo,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Resolver, useForm } from "react-hook-form";
import {
  Button,
  Card,
  Separator,
  styled,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { AppButton } from "../button";
import { AppCheckbox } from "../checkbox/Checkbox";
import { AppForm, FormField } from "../form";
import { AppInput } from "../input/Input";
import { PasswordInput } from "../input/PasswordInput";
import {
  LoginFormValues,
  loginSchema,
} from "../../validation/auth/login.schema";
import { LoginFooter, LoginFooterProps } from "./LoginFooter";
import { LoginHeader, LoginHeaderProps } from "./LoginHeader";
import { Eye, EyeOff } from "./LoginIcons";

const LOGIN_DEFAULT_VALUES: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

const loginResolver = zodResolver(
  loginSchema as unknown as Parameters<
    typeof zodResolver<
      LoginFormValues,
      unknown,
      LoginFormValues
    >
  >[0]
) as Resolver<LoginFormValues>;

export interface LoginCardProps {
  apiError?: string;
  continueLabel?: string;
  defaultValues?: Partial<LoginFormValues>;
  emailLabel?: string;
  emailPlaceholder?: string;
  forgotPasswordLabel?: string;
  footerProps?: LoginFooterProps;
  headerProps?: LoginHeaderProps;
  isLoading?: boolean;
  loginLabel?: string;
  onForgotPasswordPress?: () => void;
  onSubmit?: (values: LoginFormValues) => void | Promise<void>;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  rememberLabel?: string;
  showFooter?: boolean;
}

export const LoginCard = memo(function LoginCard({
  apiError,
  continueLabel = "or continue with",
  defaultValues,
  emailLabel = "Email address",
  emailPlaceholder = "Enter your email",
  forgotPasswordLabel = "Forgot password?",
  footerProps,
  headerProps,
  isLoading = false,
  loginLabel = "Login",
  onForgotPasswordPress,
  onSubmit,
  passwordLabel = "Password",
  passwordPlaceholder = "Enter your password",
  rememberLabel = "Remember me",
  showFooter = true,
}: LoginCardProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const formDefaultValues = useMemo<LoginFormValues>(
    () => ({
      ...LOGIN_DEFAULT_VALUES,
      ...defaultValues,
    }),
    [defaultValues]
  );

  const form = useForm<LoginFormValues>({
    defaultValues: formDefaultValues,
    resolver: loginResolver,
  });

  const handleSubmit = useCallback(
    (values: LoginFormValues) => onSubmit?.(values),
    [onSubmit]
  );

  const focusPasswordField = useCallback(() => {
    form.setFocus("password");
  }, [form]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((visible) => !visible);
    setTimeout(() => {
      form.setFocus("password");
    }, 0);
  }, [form]);

  const keepPasswordFieldFocused = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
    },
    []
  );

  return (
    <LoginShell>
      <DecorativeCorners />

      <CardContent>
        <LoginHeader {...headerProps} />

        <AppForm form={form} onSubmit={handleSubmit}>
          <FormStack>
            <FieldGroup>
              <FormField<LoginFormValues, "email">
                id="login-email"
                name="email"
                label={emailLabel}
                placeholder={emailPlaceholder}
                aria-label={emailLabel}
                autoCapitalize="none"
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                enterKeyHint="next"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={focusPasswordField}
              />
            </FieldGroup>

            <FieldGroup>
              <FormField<LoginFormValues, "password">
                id="login-password"
                name="password"
                label={passwordLabel}
              >
                {({ field, fieldState, errorId, inputId }) => (
                  <PasswordFrame>
                    <PasswordInput
                      id={inputId}
                      ref={field.ref}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder={passwordPlaceholder}
                      aria-describedby={
                        fieldState.error ? errorId : undefined
                      }
                      aria-invalid={fieldState.invalid}
                      aria-label={passwordLabel}
                      autoComplete="current-password"
                      disabled={isLoading}
                      enterKeyHint="done"
                      flex={1}
                      height={26}
                      returnKeyType="done"
                      secureTextEntry={!isPasswordVisible}
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

                    <VisibilityButton
                      type="button"
                      chromeless
                      disabled={isLoading}
                      onMouseDown={keepPasswordFieldFocused}
                      onPress={togglePasswordVisibility}
                      aria-label={
                        isPasswordVisible
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {isPasswordVisible ? (
                        <EyeOff
                          size={18}
                          color="#047857"
                          strokeWidth={2.2}
                        />
                      ) : (
                        <Eye
                          size={18}
                          color="#047857"
                          strokeWidth={2.2}
                        />
                      )}
                    </VisibilityButton>
                  </PasswordFrame>
                )}
              </FormField>
            </FieldGroup>

            <ActionRow>
              <FormField<LoginFormValues, "rememberMe">
                id="login-remember-me"
                name="rememberMe"
              >
                {({ field }) => (
                  <AppCheckbox
                    id="login-remember-me"
                    checked={Boolean(field.value)}
                    disabled={isLoading}
                    label={rememberLabel}
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true);
                    }}
                  />
                )}
              </FormField>

              <ForgotButton
                type="button"
                chromeless
                disabled={isLoading}
                hoverStyle={forgotButtonStateStyle}
                pressStyle={{ opacity: 0.72 }}
                onPress={onForgotPasswordPress}
                aria-label={forgotPasswordLabel}
              >
                <ForgotText>{forgotPasswordLabel}</ForgotText>
              </ForgotButton>
            </ActionRow>

            {apiError ? (
              <ApiErrorText role="alert">{apiError}</ApiErrorText>
            ) : null}

            <AppButton
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              background="#10B981"
              height={48}
              pressStyle={{ background: "#059669" }}
              hoverStyle={{ background: "#059669" }}
              rounded="$3"
              aria-label={loginLabel}
            >
              {loginLabel}
            </AppButton>
          </FormStack>
        </AppForm>

        {/* <DividerRow>
          <Separator flex={1} borderColor="#E5E7EB" />
          <DividerText>{continueLabel}</DividerText>
          <Separator flex={1} borderColor="#E5E7EB" />
        </DividerRow> */}

        {/* <SocialRow>
          <GoogleButton />
          <MicrosoftButton />
        </SocialRow> */}

        {showFooter ? <LoginFooter {...footerProps} /> : null}
      </CardContent>
    </LoginShell>
  );
});

function LoginShell({ children }: PropsWithChildren) {
  return (
    <LoginShellFrame style={loginShellStyle}>
      {children}
    </LoginShellFrame>
  );
}

const LoginShellFrame = styled(Card, {
  background: "white",
  borderColor: "rgba(16, 185, 129, 0.16)",
  borderWidth: 1,
  overflow: "hidden",
  p: "$7",
  rounded: "$8",
  shadowColor: "rgba(15, 118, 110, 0.22)",
  shadowRadius: 28,
  width: "100%",

  $sm: {
    p: "$5",
    rounded: "$6",
  },
});

const loginShellStyle = {
  maxWidth: 420,
  minHeight: 600,
} satisfies CSSProperties;

function CardContent({ children }: PropsWithChildren) {
  return (
    <CardContentStack style={cardContentStyle}>
      {children}
    </CardContentStack>
  );
}

const CardContentStack = styled(YStack, {
  flex: 1,
  gap: "$5",

  $sm: {
    gap: "$4",
  },
});

const cardContentStyle = {
  justifyContent: "center",
  position: "relative",
  zIndex: 1,
} satisfies CSSProperties;

const FormStack = styled(YStack, {
  gap: "$3",
});

const FieldGroup = styled(YStack, {
  gap: "$1.5",
});

function PasswordFrame({ children }: PropsWithChildren) {
  return (
    <PasswordFrameStack style={centeredRowStyle}>
      {children}
    </PasswordFrameStack>
  );
}

const PasswordFrameStack = styled(XStack, {
  background: "white",
  borderColor: "#E5E7EB",
  borderWidth: 1,
  gap: "$2",
  height: 46,
  p: "$2",
  rounded: "$3",
});

function ActionRow({ children }: PropsWithChildren) {
  return <XStack style={actionRowStyle}>{children}</XStack>;
}

const centeredRowStyle = {
  alignItems: "center",
} satisfies CSSProperties;

const actionRowStyle = {
  alignItems: "center",
  justifyContent: "space-between",
} satisfies CSSProperties;

const forgotButtonStateStyle = {
  background: "transparent",
  opacity: 1,
} satisfies CSSProperties;

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

const VisibilityButton = styled(Button, {
  height: 28,
  minW: 36,
  px: "$2",
});

const ApiErrorText = styled(Text, {
  background: "#FEF2F2",
  borderColor: "#FECACA",
  borderWidth: 1,
  color: "#B91C1C",
  fontSize: "$caption",
  fontWeight: "$label",
  letterSpacing: "$body",
  p: "$2",
  rounded: "$3",
});

function DividerRow({ children }: PropsWithChildren) {
  return (
    <DividerRowStack style={centeredRowStyle}>
      {children}
    </DividerRowStack>
  );
}

const DividerRowStack = styled(XStack, {
  gap: "$3",
});

const DividerText = styled(Text, {
  color: "#9CA3AF",
  fontSize: "$caption",
  fontWeight: "$caption",
  letterSpacing: "$body",
});

function SocialRow({ children }: PropsWithChildren) {
  return (
    <SocialRowStack style={socialRowStyle}>
      {children}
    </SocialRowStack>
  );
}

const SocialRowStack = styled(XStack, {
  gap: "$4",
});

const socialRowStyle = {
  justifyContent: "center",
} satisfies CSSProperties;

const SocialButton = styled(Button, {
  background: "white",
  borderColor: "#E5E7EB",
  borderWidth: 1,
  height: 46,
  rounded: "$4",
  width: 58,
});

const GoogleButton = memo(function GoogleButton() {
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
});

const MicrosoftButton = memo(function MicrosoftButton() {
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
});

const DecorativeCorners = memo(function DecorativeCorners() {
  return (
    <>
      <TopRightShape />
      <TopLeftLeaf />
      <TopLeftLeafSmall />
      <BottomLeftShape />
      <BottomRightShape />
    </>
  );
});

function TopRightShape() {
  return <TopRightShapeFrame style={topRightShapeStyle} />;
}

const TopRightShapeFrame = styled(View, {
  background: "#CFF7EA",
  borderBottomLeftRadius: 76,
  height: 84,
  opacity: 0.7,
  width: 118,
});

const topRightShapeStyle = {
  position: "absolute",
  right: -26,
  top: -38,
} satisfies CSSProperties;

function TopLeftLeaf() {
  return <TopLeftLeafFrame style={topLeftLeafStyle} />;
}

const TopLeftLeafFrame = styled(View, {
  background: "#10B981",
  borderBottomRightRadius: 18,
  borderTopLeftRadius: 18,
  height: 18,
  opacity: 0.72,
  width: 28,
});

const topLeftLeafStyle = {
  left: 14,
  position: "absolute",
  top: 18,
  transform: "rotate(-35deg)",
} satisfies CSSProperties;

function TopLeftLeafSmall() {
  return <TopLeftLeafSmallFrame style={topLeftLeafSmallStyle} />;
}

const TopLeftLeafSmallFrame = styled(View, {
  background: "#10B981",
  borderBottomRightRadius: 16,
  borderTopLeftRadius: 16,
  height: 16,
  opacity: 0.72,
  width: 24,
});

const topLeftLeafSmallStyle = {
  left: 48,
  position: "absolute",
  top: 42,
  transform: "rotate(-35deg)",
} satisfies CSSProperties;

function BottomLeftShape() {
  return <BottomLeftShapeFrame style={bottomLeftShapeStyle} />;
}

const BottomLeftShapeFrame = styled(View, {
  background: "#BDF4E5",
  borderTopRightRadius: 78,
  height: 96,
  opacity: 0.78,
  width: 118,
});

const bottomLeftShapeStyle = {
  bottom: -30,
  left: -42,
  position: "absolute",
} satisfies CSSProperties;

function BottomRightShape() {
  return <BottomRightShapeFrame style={bottomRightShapeStyle} />;
}

const BottomRightShapeFrame = styled(View, {
  background: "#A7F3D0",
  borderTopLeftRadius: 58,
  height: 66,
  opacity: 0.62,
  width: 72,
});

const bottomRightShapeStyle = {
  bottom: -18,
  position: "absolute",
  right: -16,
} satisfies CSSProperties;
