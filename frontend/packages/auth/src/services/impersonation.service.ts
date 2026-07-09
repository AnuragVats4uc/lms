import { authApi } from "../api/auth.api";
import { sessionManager } from "../session";

interface StartStudentImpersonationInput {
  reason?: string;
  returnTo?: string;
  studentId: string;
}

export async function startStudentImpersonation({
  reason,
  returnTo,
  studentId,
}: StartStudentImpersonationInput) {
  const data =
    await authApi.startStudentImpersonation(studentId, {
      reason,
    });

  await sessionManager.startImpersonation(
    data.student,
    data.accessToken,
    data.refreshToken,
    {
      impersonation: data.impersonation,
      returnTo,
    }
  );

  return data;
}

export function getCurrentImpersonation() {
  return authApi.currentImpersonation();
}

export async function stopImpersonation() {
  let stopResponse;

  try {
    stopResponse = await authApi.stopImpersonation();
  } finally {
    const adminSession =
      await sessionManager.restoreAdminSession();

    return {
      ...(stopResponse ?? {
        isImpersonating: false as const,
        impersonation: null,
        message: "Impersonation stopped locally",
      }),
      returnTo: adminSession?.returnTo,
    };
  }
}
