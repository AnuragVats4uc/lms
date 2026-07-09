"use client";

import {
  CSSProperties,
  PropsWithChildren,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  getAuthErrorMessage,
  PublicRoute,
  useLogin,
} from "@repo/auth";
import {
  LoginCard,
  LoginFormValues,
  styled,
  View,
  YStack,
} from "@repo/ui";

export default function LoginPage() {
  const router = useRouter();
  const {
    error,
    isPending,
    mutate,
  } = useLogin();

  const handleSubmit = useCallback(
    (values: LoginFormValues) => {
      mutate({
        email: values.email,
        password: values.password,
      });
    },
    [mutate]
  );

  return (
    <PublicRoute>
      <LoginPageShell>
        <TopBackgroundShape />
        <BottomBackgroundShape />
        <LoginCard
          apiError={
            error ? getAuthErrorMessage(error) : undefined
          }
          isLoading={isPending}
          footerProps={{
            onRegisterPress: () => router.push("/register"),
          }}
          onForgotPasswordPress={() => undefined}
          onSubmit={handleSubmit}
        />
      </LoginPageShell>
    </PublicRoute>
  );
}

function LoginPageShell({ children }: PropsWithChildren) {
  return (
    <LoginPageShellFrame style={loginPageShellStyle}>
      {children}
    </LoginPageShellFrame>
  );
}

const LoginPageShellFrame = styled(YStack, {
  flex: 1,
  background:
    "linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 44%, #D1FAE5 100%)",
  overflow: "hidden",
  p: "$5",

  $sm: {
    p: "$4",
    pt: "$7",
  },
});

const loginPageShellStyle = {
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  position: "relative",
} satisfies CSSProperties;

function TopBackgroundShape() {
  return <TopBackgroundShapeFrame style={topBackgroundShapeStyle} />;
}

const TopBackgroundShapeFrame = styled(View, {
  background: "rgba(16, 185, 129, 0.16)",
  borderBottomRightRadius: 170,
  height: 190,
  width: 250,
});

const topBackgroundShapeStyle = {
  left: -80,
  position: "absolute",
  top: -90,
} satisfies CSSProperties;

function BottomBackgroundShape() {
  return (
    <BottomBackgroundShapeFrame style={bottomBackgroundShapeStyle} />
  );
}

const BottomBackgroundShapeFrame = styled(View, {
  background: "rgba(20, 184, 166, 0.14)",
  borderTopLeftRadius: 180,
  height: 210,
  width: 260,
});

const bottomBackgroundShapeStyle = {
  bottom: -110,
  position: "absolute",
  right: -80,
} satisfies CSSProperties;
