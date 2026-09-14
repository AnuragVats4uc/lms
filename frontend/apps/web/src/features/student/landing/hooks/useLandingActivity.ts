import { useCallback, useEffect, useRef } from "react";
import { studentLandingApi } from "@repo/api";
import type { StudentLandingCard } from "@repo/types";

import { clearStudentWelcome } from "@/features/auth/student-welcome-session";

export const useLandingActivity = (isWelcomeAvailable: boolean) => {
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (!isWelcomeAvailable || viewRecorded.current) return;

    viewRecorded.current = true;
    void studentLandingApi
      .recordView(crypto.randomUUID())
      .catch(() => undefined);
  }, [isWelcomeAvailable]);

  return useCallback((card: StudentLandingCard) => {
    clearStudentWelcome();

    if (card.id === 0) return;
    void studentLandingApi
      .recordClick(card.uuid, crypto.randomUUID())
      .catch(() => undefined);
  }, []);
};
