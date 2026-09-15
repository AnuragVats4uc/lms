"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CreateSessionCourseRequest,
  SessionCourse,
  UpdateSessionCourseRequest,
} from "@repo/types";
import { sessionCourseSchema } from "@repo/validation";
import { CrudManagementPage } from "../components/crud/CrudManagementPage";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import { SessionCourseContextControls } from "./components/context/SessionCourseContextControls";
import { SessionCourseDetails } from "./components/details/SessionCourseDetails";
import { SessionCourseFormFields } from "./components/form/SessionCourseFormFields";
import { createSessionCourseStats } from "./components/stats/createSessionCourseStats";
import { createSessionCourseColumns } from "./components/table/createSessionCourseColumns";
import {
  initialSessionCourseForm,
  sessionCourseStatusOptions,
} from "./constants";
import { useAvailableCourses } from "./hooks/useAvailableCourses";
import { useSessionCourseOperations } from "./hooks/useSessionCourseOperations";
import type { SessionCourseForm } from "./types";
import {
  toCreateSessionCoursePayload,
  toSessionCourseForm,
  toUpdateSessionCoursePayload,
} from "./utils/sessionCoursePayload";

const sessionCourseColumns = createSessionCourseColumns();

export const SessionCoursesPage = () => {
  const academic = useAcademicSessions();
  const coursesQuery = useAvailableCourses();
  const operations = useSessionCourseOperations(academic.selectedSessionId);
  const selectedSession = academic.sessions.find(
    (session) => session.id === academic.selectedSessionId,
  );

  return (
    <CrudManagementPage<
      SessionCourse,
      SessionCourseForm,
      CreateSessionCourseRequest,
      UpdateSessionCourseRequest
    >
      columns={sessionCourseColumns}
      context={
        <SessionCourseContextControls
          organizations={academic.organizations}
          selectedOrganizationId={academic.selectedOrganizationId}
          selectedSessionId={academic.selectedSessionId}
          sessions={academic.sessions}
          setOrganizationId={academic.setSelectedOrganizationId}
          setSessionId={academic.setSelectedSessionId}
        />
      }
      create={operations.create}
      description="Assign reusable courses to a session and control their session-specific publishing state."
      emptyDescription={
        selectedSession
          ? `Assign the first course to ${selectedSession.name}.`
          : "Select a session to view its courses."
      }
      enabled={academic.selectedSessionId !== null}
      entityLabel="Session Course"
      formResolver={zodResolver(sessionCourseSchema)}
      getDisplayName={(item) => item.displayName ?? item.course.name}
      getIsActive={(item) => item.isActive}
      getRowId={(item) => item.id}
      getStats={createSessionCourseStats}
      initialForm={initialSessionCourseForm}
      permissionPrefix="session-course"
      queryFn={operations.findAll}
      queryKey={["admin", "session-courses", academic.selectedSessionId]}
      remove={operations.remove}
      renderDetails={(item) => <SessionCourseDetails item={item} />}
      renderForm={(context) => (
        <SessionCourseFormFields
          {...context}
          courses={coursesQuery.data?.items ?? []}
        />
      )}
      setActive={operations.setActive}
      statusOptions={sessionCourseStatusOptions}
      title="Session Courses"
      toCreatePayload={toCreateSessionCoursePayload}
      toForm={toSessionCourseForm}
      toUpdatePayload={toUpdateSessionCoursePayload}
      update={operations.update}
    />
  );
};

export default SessionCoursesPage;
