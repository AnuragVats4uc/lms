import { useQuery } from "@tanstack/react-query";

import { getCurrentImpersonation } from "../services/impersonation.service";
import { useAuthStore } from "../store";

export function useCurrentImpersonation() {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  return useQuery({
    enabled: isAuthenticated,
    queryFn: getCurrentImpersonation,
    queryKey: ["admin-impersonation", "current"],
    retry: false,
    staleTime: 30 * 1000,
  });
}
