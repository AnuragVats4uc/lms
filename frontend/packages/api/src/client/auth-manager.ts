export interface AuthManager {
  getAccessToken(): Promise<string | null>;

  getRefreshToken(): Promise<string | null>;

  saveTokens(
    accessToken: string,
    refreshToken: string
  ): Promise<void>;

  refreshToken(
    refreshToken: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;

  logout(): Promise<void>;
}

let manager: AuthManager;

export function configureAuthManager(
  authManager: AuthManager
) {
  manager = authManager;
}

export function getAuthManager() {
  if (!manager) {
    throw new Error(
      "AuthManager has not been configured."
    );
  }

  return manager;
}

export function hasAuthManager() {
  return Boolean(manager);
}
