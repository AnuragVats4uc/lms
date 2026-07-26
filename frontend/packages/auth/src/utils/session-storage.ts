import { AUTH_KEYS } from "../constants/auth.constant";
import { AuthUser } from "../types/auth.types";
import { getStorage } from "./auth-storage";

export const storedSession = {
  async saveUser(user: AuthUser) {
    await getStorage().setItem(
      AUTH_KEYS.USER,
      JSON.stringify(user)
    );
  },

  async getUser() {
    const value = await getStorage().getItem(
      AUTH_KEYS.USER
    );

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      await getStorage().removeItem(AUTH_KEYS.USER);
      return null;
    }
  },

  async clearUser() {
    await getStorage().removeItem(AUTH_KEYS.USER);
  },
};
