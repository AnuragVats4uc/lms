import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { STUDENT_DASHBOARD_PATH } from "@/features/auth/routes";
import { hasStudentWelcome } from "@/features/auth/student-welcome-session";

export const useStudentLandingAccess = (userUuid?: string) => {
  const router = useRouter();
  const accessResolved = useRef(false);
  const [isWelcomeAvailable, setIsWelcomeAvailable] = useState(false);

  useEffect(() => {
    if (!userUuid || accessResolved.current) return;

    accessResolved.current = true;
    if (!hasStudentWelcome(userUuid)) {
      router.replace(STUDENT_DASHBOARD_PATH);
      return;
    }

    // This state is resolved from sessionStorage, an external browser system.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsWelcomeAvailable(true);
  }, [router, userUuid]);

  return isWelcomeAvailable;
};
