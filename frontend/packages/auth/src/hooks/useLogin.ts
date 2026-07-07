import { useMutation } from "@tanstack/react-query";

import { login } from "../services/auth.service";
import { sessionManager } from "../session";

export function useLogin() {
  return useMutation({
    mutationFn: login,

    async onSuccess(data) {
      await sessionManager.login(
        data.student,
        data.accessToken,
        data.refreshToken
      );
    },
  });
}