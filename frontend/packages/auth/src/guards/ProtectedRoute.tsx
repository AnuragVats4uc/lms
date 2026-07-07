"use client";

import {
  PropsWithChildren,
  useEffect,
} from "react";

import {
  useIsAuthInitializing,
  useIsAuthenticated,
} from "../store";
import { useAuthNavigation } from "../providers/AuthNavigationProvider";

interface ProtectedRouteProps extends PropsWithChildren {
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  fallback = null,
  redirectTo,
}: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isInitializing = useIsAuthInitializing();
  const navigation = useAuthNavigation();
  const destination = redirectTo ?? navigation.loginPath;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigation.redirect(destination);
    }
  }, [
    destination,
    isAuthenticated,
    isInitializing,
    navigation,
  ]);

  if (isInitializing || !isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
