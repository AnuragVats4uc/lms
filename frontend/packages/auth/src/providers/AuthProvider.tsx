"use client";

import { PropsWithChildren } from "react";
import { useBootstrapSession } from "../hooks";

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const loading = useBootstrapSession();

  if (loading) {
    return <>Loading...</>;
  }

  return <>{children}</>;
}