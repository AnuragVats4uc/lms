import { token } from "../utils/token";
import { useAuthStore } from "../store";
import { AuthUser } from "../types/auth.types";
import { storedSession } from "../utils/session-storage";
import {
  logout as revokeSession,
  refreshToken as refreshSessionToken,
} from "../services/auth.service";

interface SessionManagerOptions {
  clearQueryCache?: () => void;
  onLogout?: () => void;
}

interface LogoutOptions {
  notify?: boolean;
  revoke?: boolean;
}

class SessionManager {
  private clearQueryCache?: () => void;

  private onLogout?: () => void;

  configure({
    clearQueryCache,
    onLogout,
  }: SessionManagerOptions) {
    this.clearQueryCache = clearQueryCache;
    this.onLogout = onLogout;
  }

  async login(
    user: AuthUser,
    accessToken: string,
    refreshToken: string
  ) {
    await token.save(accessToken, refreshToken);
    await storedSession.saveUser(user);

    useAuthStore
      .getState()
      .login(user, accessToken, refreshToken);
  }

  async saveTokens(
    accessToken: string,
    refreshToken: string,
    user?: AuthUser
  ) {
    await token.save(accessToken, refreshToken);

    const currentUser =
      user ??
      useAuthStore.getState().currentUser ??
      await storedSession.getUser();

    if (currentUser) {
      await storedSession.saveUser(currentUser);

      useAuthStore
        .getState()
        .login(currentUser, accessToken, refreshToken);
    }
  }

  async restoreAuthenticatedSession(
    user: AuthUser,
    accessToken: string,
    refreshToken: string
  ) {
    await storedSession.saveUser(user);

    useAuthStore
      .getState()
      .login(user, accessToken, refreshToken);
  }

  async logout({
    notify = true,
    revoke = true,
  }: LogoutOptions = {}) {
    const refreshToken = revoke
      ? await token.getRefreshToken()
      : null;

    if (refreshToken) {
      try {
        const tokens =
          await refreshSessionToken(refreshToken);

        await token.save(
          tokens.accessToken,
          tokens.refreshToken
        );

        await revokeSession(tokens.refreshToken);
      } catch {
        // Local logout must still complete when the server session is already invalid.
      }
    }

    await token.clear();
    await storedSession.clearUser();

    useAuthStore
      .getState()
      .logout();

    this.clearQueryCache?.();

    if (notify) {
      this.onLogout?.();
    }
  }

  async getAccessToken() {
    return token.getAccessToken();
  }

  async getRefreshToken() {
    return token.getRefreshToken();
  }

  async getStoredUser() {
    return storedSession.getUser();
  }

  isAuthenticated() {
    return useAuthStore
      .getState()
      .isAuthenticated;
  }
}

export const sessionManager =
  new SessionManager();
