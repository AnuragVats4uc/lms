"use client";

import {
  PropsWithChildren,
  useEffect,
} from "react";

import {
  useIsAuthInitializing,
  useIsAuthenticated,
  useCurrentUser,
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
  const currentUser = useCurrentUser();
  const navigation = useAuthNavigation();
  const destination =
    redirectTo ?? navigation.getAuthenticatedPath(currentUser);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigation.redirect(destination);
    }
  }, [
    destination,
    currentUser,
    isAuthenticated,
    isInitializing,
    navigation,
  ]);

  if (isInitializing || isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
