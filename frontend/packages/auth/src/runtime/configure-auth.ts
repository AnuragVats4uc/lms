import {
  AuthManager,
  configureAuthManager,
  setupApi,
} from "@repo/api";
import { QueryClient } from "@tanstack/react-query";

import { refreshToken } from "../services/auth.service";
import { sessionManager } from "../session";
import { StorageAdapter } from "../utils";
import { configureStorage } from "../utils/auth-storage";

export interface ConfigureAuthOptions {
  onLogout?: () => void;
  queryClient?: QueryClient;
  storage: StorageAdapter;
}

let isConfigured = false;

export function configureAuth({
  onLogout,
  queryClient,
  storage,
}: ConfigureAuthOptions) {
  configureStorage(storage);

  sessionManager.configure({
    clearQueryCache: () => {
      queryClient?.clear();
    },
    onLogout,
  });

  const authManager: AuthManager = {
    getAccessToken: () =>
      sessionManager.getAccessToken(),

    getRefreshToken: () =>
      sessionManager.getRefreshToken(),

    saveTokens: (
      accessToken,
      refreshTokenValue,
      user
    ) =>
      sessionManager.saveTokens(
        accessToken,
        refreshTokenValue,
        user as Parameters<
          typeof sessionManager.saveTokens
        >[2]
      ),

    refreshToken,

    logout: () =>
      sessionManager.logout({
        notify: true,
        revoke: false,
      }),
  };

  configureAuthManager(authManager);

  if (!isConfigured) {
    setupApi();
    isConfigured = true;
  }
}
