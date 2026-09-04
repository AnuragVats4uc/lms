import { useMutation } from "@tanstack/react-query";

import { login } from "../services/auth.service";
import { sessionManager } from "../session";
import type { LoginData } from "../types";

interface UseLoginOptions {
  onLoginSuccess?: (data: LoginData) => Promise<void> | void;
}

export function useLogin({ onLoginSuccess }: UseLoginOptions = {}) {
  return useMutation({
    mutationFn: login,

    async onSuccess(data) {
      await onLoginSuccess?.(data);
      await sessionManager.login(
        data.user,
        data.accessToken,
        data.refreshToken,
      );
    },
  });
}
