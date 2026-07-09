import { useMutation, useQueryClient } from "@tanstack/react-query";

import { stopImpersonation } from "../services/impersonation.service";

export function useStopImpersonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stopImpersonation,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
