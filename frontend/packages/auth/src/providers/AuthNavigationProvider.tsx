"use client";

import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";
import type { AuthUser } from "../types";

interface AuthNavigationContextValue {
  dashboardPath: string;
  getAuthenticatedPath: (user: AuthUser | null) => string;
  loginPath: string;
  redirect: (path: string) => void;
}

const AuthNavigationContext =
  createContext<AuthNavigationContextValue | null>(
    null
  );

interface AuthNavigationProviderProps
  extends PropsWithChildren {
  dashboardPath: string;
  getAuthenticatedPath?: (user: AuthUser | null) => string;
  loginPath: string;
  redirect: (path: string) => void;
}

export function AuthNavigationProvider({
  children,
  dashboardPath,
  getAuthenticatedPath,
  loginPath,
  redirect,
}: AuthNavigationProviderProps) {
  const value = useMemo(
    () => ({
      dashboardPath,
      getAuthenticatedPath:
        getAuthenticatedPath ??
        (() => dashboardPath),
      loginPath,
      redirect,
    }),
    [dashboardPath, getAuthenticatedPath, loginPath, redirect]
  );

  return (
    <AuthNavigationContext.Provider value={value}>
      {children}
    </AuthNavigationContext.Provider>
  );
}

export function useAuthNavigation() {
  const context = useContext(AuthNavigationContext);

  if (!context) {
    throw new Error(
      "Auth navigation has not been configured."
    );
  }

  return context;
}
