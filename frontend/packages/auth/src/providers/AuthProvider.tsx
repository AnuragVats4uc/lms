"use client";

import {
  PropsWithChildren,
  useEffect,
  useMemo,
} from "react";
import { QueryClient } from "@tanstack/react-query";
import type { AuthUser } from "../types";

import { useBootstrapSession } from "../hooks";
import {
  configureAuth,
  ConfigureAuthOptions,
} from "../runtime";
import { StorageAdapter } from "../utils";
import { AuthNavigationProvider } from "./AuthNavigationProvider";

interface AuthProviderProps extends PropsWithChildren {
  dashboardPath?: string;
  getAuthenticatedPath?: (user: AuthUser | null) => string;
  loadingFallback?: React.ReactNode;
  loginPath?: string;
  onRedirect: (path: string) => void;
  queryClient?: QueryClient;
  storage: StorageAdapter;
}

export function AuthProvider({
  children,
  dashboardPath = "/dashboard",
  getAuthenticatedPath,
  loadingFallback = null,
  loginPath = "/login",
  onRedirect,
  queryClient,
  storage,
}: AuthProviderProps) {
  const configureOptions =
    useMemo<ConfigureAuthOptions>(
      () => ({
        onLogout: () => {
          onRedirect(loginPath);
        },
        queryClient,
        storage,
      }),
      [loginPath, onRedirect, queryClient, storage]
    );

  useEffect(() => {
    configureAuth(configureOptions);
  }, [configureOptions]);

  const loading = useBootstrapSession();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  return (
    <AuthNavigationProvider
      dashboardPath={dashboardPath}
      getAuthenticatedPath={getAuthenticatedPath}
      loginPath={loginPath}
      redirect={onRedirect}
    >
      {children}
    </AuthNavigationProvider>
  );
}
