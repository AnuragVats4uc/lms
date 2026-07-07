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

interface PublicRouteProps extends PropsWithChildren {
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function PublicRoute({
  children,
  fallback = null,
  redirectTo,
}: PublicRouteProps) {
  const isAuthenticated = useIsAuthenticated();
  const isInitializing = useIsAuthInitializing();
  const navigation = useAuthNavigation();
  const destination =
    redirectTo ?? navigation.dashboardPath;

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigation.redirect(destination);
    }
  }, [
    destination,
    isAuthenticated,
    isInitializing,
    navigation,
  ]);

  if (isInitializing || isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
