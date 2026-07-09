import { token } from "../utils/token";
import { useAuthStore } from "../store";
import {
  ImpersonationLog,
  Student,
} from "../types/auth.types";
import { storedSession } from "../utils/session-storage";
import { impersonationSession } from "../utils/impersonation-session";
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

interface StartImpersonationOptions {
  impersonation: ImpersonationLog;
  returnTo?: string;
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

  async startImpersonation(
    student: Student,
    accessToken: string,
    refreshToken: string,
    options: StartImpersonationOptions
  ) {
    const state = useAuthStore.getState();
    const currentStudent =
      state.student ?? (await storedSession.getUser());
    const currentAccessToken =
      state.accessToken ?? (await token.getAccessToken());
    const currentRefreshToken =
      state.refreshToken ?? (await token.getRefreshToken());

    if (
      currentStudent &&
      currentAccessToken &&
      currentRefreshToken
    ) {
      await impersonationSession.saveAdminSession({
        accessToken: currentAccessToken,
        refreshToken: currentRefreshToken,
        returnTo: options.returnTo,
        student: currentStudent,
      });
    }

    await impersonationSession.saveMeta(
      options.impersonation
    );

    await this.login(student, accessToken, refreshToken);
  }

  async restoreAdminSession() {
    const adminSession =
      await impersonationSession.getAdminSession();

    await impersonationSession.clear();

    if (!adminSession) {
      await this.logout({
        notify: false,
        revoke: false,
      });

      return null;
    }

    await token.save(
      adminSession.accessToken,
      adminSession.refreshToken
    );
    await storedSession.saveUser(adminSession.student);

    useAuthStore.getState().login(
      adminSession.student,
      adminSession.accessToken,
      adminSession.refreshToken
    );

    this.clearQueryCache?.();

    return adminSession;
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
