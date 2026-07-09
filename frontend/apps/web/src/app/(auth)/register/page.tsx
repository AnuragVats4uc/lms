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
  useRegister,
} from "@repo/auth";
import {
  RegisterCard,
  RegisterFormValues,
  styled,
  View,
  YStack,
} from "@repo/ui";

export default function RegisterPage() {
  const router = useRouter();
  const {
    data,
    error,
    isPending,
    mutate,
  } = useRegister();

  const handleSubmit = useCallback(
    (values: RegisterFormValues) => {
      mutate({
        address: values.address,
        city: values.city,
        className: values.className,
        email: values.email,
        firstName: values.firstName,
        gender: values.gender,
        lastName: values.lastName,
        mobile: values.mobile,
        password: values.password,
        state: values.state,
      });
    },
    [mutate]
  );

  return (
    <PublicRoute>
      <RegisterPageShell>
        <TopBackgroundShape />
        <BottomBackgroundShape />
        <RegisterCard
          apiError={
            error ? getAuthErrorMessage(error) : undefined
          }
          isLoading={isPending}
          onLoginPress={() => router.push("/login")}
          onSubmit={handleSubmit}
          successMessage={
            data?.message
              ? `${data.message}. You can login now.`
              : undefined
          }
        />
      </RegisterPageShell>
    </PublicRoute>
  );
}

function RegisterPageShell({ children }: PropsWithChildren) {
  return (
    <RegisterPageShellFrame style={registerPageShellStyle}>
      {children}
    </RegisterPageShellFrame>
  );
}

const RegisterPageShellFrame = styled(YStack, {
  flex: 1,
  background:
    "linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 44%, #D1FAE5 100%)",
  overflow: "hidden",
  p: "$5",

  $sm: {
    p: "$4",
    pt: "$6",
  },
});

const registerPageShellStyle = {
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
