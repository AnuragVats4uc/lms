import { useMutation } from "@tanstack/react-query";

import { refreshToken } from "../services/auth.service";

export function useRefreshToken() {
  return useMutation({
    mutationFn: refreshToken,
  });
}