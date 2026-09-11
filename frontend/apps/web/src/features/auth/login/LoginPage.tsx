"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthErrorMessage, PublicRoute, useLogin } from "@repo/auth";
import type { LoginFormValues } from "@repo/ui";

import {
  clearStudentWelcome,
  prepareStudentWelcome,
} from "../student-welcome-session";
import { LoginBackground } from "./components/LoginBackground";
import { LoginFormPanel } from "./components/LoginFormPanel";
import { LoginHeader } from "./components/LoginHeader";
import { LoginHero } from "./components/LoginHero";
import { useLoginPrefill } from "./hooks/useLoginPrefill";
import {
  LoginContent,
  loginContentStyle,
  LoginPageShellFrame,
  loginPageShellStyle,
} from "./LoginPage.styles";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const prefillPassword = useLoginPrefill(queryEmail);
  const { error, isPending, mutate } = useLogin({
    onLoginSuccess: (data) => {
      if (data.user.roles.includes("STUDENT")) {
        prepareStudentWelcome(data.user.uuid);
        return;
      }

      clearStudentWelcome();
    },
  });

  const handleSubmit = useCallback(
    (values: LoginFormValues) => {
      mutate({
        email: values.email,
        password: values.password,
      });
    },
    [mutate],
  );

  const defaultValues = useMemo(
    () => ({
      email: queryEmail,
      password: prefillPassword,
    }),
    [prefillPassword, queryEmail],
  );

  return (
    <PublicRoute>
      <LoginPageShellFrame
        className="lms-login-shell"
        style={loginPageShellStyle}
      >
        <LoginBackground />
        <LoginHeader />

        <LoginContent className="lms-login-content" style={loginContentStyle}>
          <LoginHero />
          <LoginFormPanel
            apiError={error ? getAuthErrorMessage(error) : undefined}
            defaultValues={defaultValues}
            isLoading={isPending}
            key={`${defaultValues.email}:${
              defaultValues.password ? "prefilled" : "empty"
            }`}
            onForgotPasswordPress={() => router.push("/forgot-password")}
            onSubmit={handleSubmit}
          />
        </LoginContent>
      </LoginPageShellFrame>
    </PublicRoute>
  );
};

export default LoginPage;
