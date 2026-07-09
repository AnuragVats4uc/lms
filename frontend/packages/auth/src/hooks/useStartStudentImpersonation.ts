import { useMutation, useQueryClient } from "@tanstack/react-query";

import { startStudentImpersonation } from "../services/impersonation.service";

interface StartStudentImpersonationVariables {
  reason?: string;
  returnTo?: string;
  studentId: string;
}

export function useStartStudentImpersonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      variables: StartStudentImpersonationVariables
    ) => startStudentImpersonation(variables),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
