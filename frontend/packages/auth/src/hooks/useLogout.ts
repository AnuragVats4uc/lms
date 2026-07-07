import { useMutation } from "@tanstack/react-query";
import { sessionManager } from "../session";

export function useLogout() {
  return useMutation({
    mutationFn: () => sessionManager.logout(),
  });
}