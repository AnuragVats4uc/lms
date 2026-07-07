import { token } from "../utils/token";
import { useAuthStore } from "../store";
import { Student } from "../types/auth.types";

class SessionManager {
  async login(
    student: Student,
    accessToken: string,
    refreshToken: string
  ) {
    await token.save(accessToken, refreshToken);

    useAuthStore
      .getState()
      .login(student, accessToken, refreshToken);
  }

  async logout() {
    await token.clear();

    useAuthStore
      .getState()
      .logout();
  }

  async getAccessToken() {
    return token.getAccessToken();
  }

  async getRefreshToken() {
    return token.getRefreshToken();
  }

  isAuthenticated() {
    return useAuthStore
      .getState()
      .isAuthenticated;
  }
}

export const sessionManager =
  new SessionManager();