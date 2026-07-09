import { AUTH_KEYS } from "../constants/auth.constant";
import {
  ImpersonationLog,
  Student,
} from "../types/auth.types";
import { getStorage } from "./auth-storage";

export interface AdminSessionSnapshot {
  accessToken: string;
  refreshToken: string;
  returnTo?: string;
  student: Student;
}

export const impersonationSession = {
  async clear() {
    const storage = getStorage();

    await storage.removeItem(
      AUTH_KEYS.ADMIN_IMPERSONATION_SESSION
    );
    await storage.removeItem(AUTH_KEYS.IMPERSONATION_META);
  },

  async getAdminSession() {
    const value = await getStorage().getItem(
      AUTH_KEYS.ADMIN_IMPERSONATION_SESSION
    );

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AdminSessionSnapshot;
    } catch {
      await this.clear();
      return null;
    }
  },

  async getMeta() {
    const value = await getStorage().getItem(
      AUTH_KEYS.IMPERSONATION_META
    );

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as ImpersonationLog;
    } catch {
      await getStorage().removeItem(
        AUTH_KEYS.IMPERSONATION_META
      );
      return null;
    }
  },

  async saveAdminSession(session: AdminSessionSnapshot) {
    await getStorage().setItem(
      AUTH_KEYS.ADMIN_IMPERSONATION_SESSION,
      JSON.stringify(session)
    );
  },

  async saveMeta(meta: ImpersonationLog) {
    await getStorage().setItem(
      AUTH_KEYS.IMPERSONATION_META,
      JSON.stringify(meta)
    );
  },
};
