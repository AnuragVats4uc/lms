import { token } from "../utils/token";
import { useAuthStore } from "../store";
import { Student } from "../types/auth.types";
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
    student: Student,
    accessToken: string,
    refreshToken: string
  ) {
    await token.save(accessToken, refreshToken);
    await storedSession.saveUser(student);

    useAuthStore
      .getState()
      .login(student, accessToken, refreshToken);
  }

  async saveTokens(
    accessToken: string,
    refreshToken: string
  ) {
    await token.save(accessToken, refreshToken);

    const currentStudent =
      useAuthStore.getState().student ??
      await storedSession.getUser();

    if (currentStudent) {
      useAuthStore
        .getState()
        .login(currentStudent, accessToken, refreshToken);
    }
  }

  async restoreAuthenticatedSession(
    student: Student,
    accessToken: string,
    refreshToken: string
  ) {
    await storedSession.saveUser(student);

    useAuthStore
      .getState()
      .login(student, accessToken, refreshToken);
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
