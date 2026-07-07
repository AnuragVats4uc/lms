"use client";

import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";

interface AuthNavigationContextValue {
  dashboardPath: string;
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
  loginPath: string;
  redirect: (path: string) => void;
}

export function AuthNavigationProvider({
  children,
  dashboardPath,
  loginPath,
  redirect,
}: AuthNavigationProviderProps) {
  const value = useMemo(
    () => ({
      dashboardPath,
      loginPath,
      redirect,
    }),
    [dashboardPath, loginPath, redirect]
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
