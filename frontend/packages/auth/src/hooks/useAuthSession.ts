import {
  useCallback,
  useMemo,
} from "react";

import { bootstrapSession } from "../session";
import { sessionManager } from "../session";
import { useAuthStore } from "../store";

export function useAuthSession() {
  const student = useAuthStore((state) => state.student);
  const accessToken = useAuthStore(
    (state) => state.accessToken
  );
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const isInitializing = useAuthStore(
    (state) => state.isInitializing
  );
  const permissions = useAuthStore(
    (state) => state.permissions
  );
  const refreshToken = useAuthStore(
    (state) => state.refreshToken
  );
  const role = useAuthStore((state) => state.role);
  const status = useAuthStore((state) => state.status);

  const logout = useCallback(
    () => sessionManager.logout(),
    []
  );

  const refreshSession = useCallback(
    () => bootstrapSession(),
    []
  );

  return useMemo(
    () => ({
      accessToken,
      currentUser: student,
      isAuthenticated,
      isInitializing,
      logout,
      permissions,
      refreshSession,
      refreshToken,
      role,
      status,
    }),
    [
      accessToken,
      isAuthenticated,
      isInitializing,
      logout,
      permissions,
      refreshSession,
      refreshToken,
      role,
      status,
      student,
    ]
  );
}
