"use client";

import { CSSProperties, ReactNode } from "react";

import { useStartStudentImpersonation } from "../hooks";

interface LoginAsStudentButtonProps {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onError?: (error: unknown) => void;
  onStarted?: (redirectUrl: string) => void;
  reason?: string;
  returnTo?: string;
  studentId: string;
  style?: CSSProperties;
}

export function LoginAsStudentButton({
  children = "Login as Student",
  className,
  disabled,
  onError,
  onStarted,
  reason,
  returnTo,
  studentId,
  style,
}: LoginAsStudentButtonProps) {
  const mutation = useStartStudentImpersonation();

  const handleClick = () => {
    const resolvedReturnTo =
      returnTo ??
      (typeof globalThis.location !== "undefined"
        ? `${globalThis.location.pathname}${globalThis.location.search}`
        : undefined);

    mutation.mutate(
      {
        reason,
        returnTo: resolvedReturnTo,
        studentId,
      },
      {
        onError,
        onSuccess: (data) => {
          onStarted?.(data.redirectUrl);

          if (typeof globalThis.location !== "undefined") {
            globalThis.location.assign(data.redirectUrl);
          }
        },
      }
    );
  };

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || mutation.isPending}
      onClick={handleClick}
      style={{
        alignItems: "center",
        background: "#0aa36f",
        border: 0,
        borderRadius: 10,
        color: "#ffffff",
        cursor:
          disabled || mutation.isPending
            ? "not-allowed"
            : "pointer",
        display: "inline-flex",
        fontSize: 14,
        fontWeight: 700,
        gap: 8,
        minHeight: 38,
        opacity: disabled || mutation.isPending ? 0.7 : 1,
        padding: "0 14px",
        ...style,
      }}
    >
      {mutation.isPending ? "Opening..." : children}
    </button>
  );
}
