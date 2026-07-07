import { AUTH_KEYS } from "../constants/auth.constant";
import { Student } from "../types/auth.types";
import { getStorage } from "./auth-storage";

export const storedSession = {
  async saveUser(student: Student) {
    await getStorage().setItem(
      AUTH_KEYS.USER,
      JSON.stringify(student)
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
      return JSON.parse(value) as Student;
    } catch {
      await getStorage().removeItem(AUTH_KEYS.USER);
      return null;
    }
  },

  async clearUser() {
    await getStorage().removeItem(AUTH_KEYS.USER);
  },
};
