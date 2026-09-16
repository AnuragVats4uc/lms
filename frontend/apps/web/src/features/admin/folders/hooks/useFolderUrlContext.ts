import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export const useFolderUrlContext = ({
  selectedOrganizationId,
  selectedSessionId,
  setSelectedOrganizationId,
  setSelectedSessionId,
}: {
  selectedOrganizationId: number | null;
  selectedSessionId: number | null;
  setSelectedOrganizationId: (id: number | null) => void;
  setSelectedSessionId: (id: number | null) => void;
}) => {
  const searchParams = useSearchParams();
  const organizationId = Number(searchParams.get("organizationId")) || null;
  const sessionId = Number(searchParams.get("sessionId")) || null;
  const sessionCourseId = Number(searchParams.get("sessionCourseId")) || null;

  useEffect(() => {
    if (organizationId !== null && selectedOrganizationId !== organizationId) {
      setSelectedOrganizationId(organizationId);
    }
    if (sessionId !== null && selectedSessionId !== sessionId) {
      setSelectedSessionId(sessionId);
    }
  }, [
    organizationId,
    selectedOrganizationId,
    selectedSessionId,
    sessionId,
    setSelectedOrganizationId,
    setSelectedSessionId,
  ]);

  return { requestedSessionCourseId: sessionCourseId };
};
