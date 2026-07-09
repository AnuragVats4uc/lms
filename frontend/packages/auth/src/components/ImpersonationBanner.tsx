"use client";

import { CSSProperties } from "react";

import {
  useCurrentImpersonation,
  useStopImpersonation,
} from "../hooks";

interface ImpersonationBannerProps {
  className?: string;
  fallbackReturnTo?: string;
  style?: CSSProperties;
}

export function ImpersonationBanner({
  className,
  fallbackReturnTo = "/dashboard",
  style,
}: ImpersonationBannerProps) {
  const current = useCurrentImpersonation();
  const stop = useStopImpersonation();
  const data = current.data;

  if (!data?.isImpersonating) {
    return null;
  }

  const handleExit = () => {
    stop.mutate(undefined, {
      onSuccess: (response) => {
        if (typeof globalThis.location !== "undefined") {
          globalThis.location.assign(
            response.returnTo ?? fallbackReturnTo
          );
        }
      },
    });
  };

  return (
    <div
      className={className}
      role="status"
      style={{
        alignItems: "center",
        background: "#064e3b",
        borderRadius: 14,
        boxShadow: "0 12px 28px rgba(6, 78, 59, 0.18)",
        color: "#ffffff",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        justifyContent: "space-between",
        margin: "0 auto 18px",
        maxWidth: 1160,
        padding: "11px 14px",
        position: "relative",
        zIndex: 3,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.35,
        }}
      >
        You are viewing this account as{" "}
        {data.studentName || "this student"}.
      </span>

      <button
        type="button"
        disabled={stop.isPending}
        onClick={handleExit}
        style={{
          background: "#ffffff",
          border: 0,
          borderRadius: 999,
          color: "#047857",
          cursor: stop.isPending ? "not-allowed" : "pointer",
          fontSize: 13,
          fontWeight: 800,
          minHeight: 32,
          opacity: stop.isPending ? 0.75 : 1,
          padding: "0 13px",
        }}
      >
        {stop.isPending
          ? "Exiting..."
          : "Exit impersonation"}
      </button>
    </div>
  );
}
