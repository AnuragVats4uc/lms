import type { SessionCourse } from "@repo/types";
import { XStack, YStack } from "@repo/ui";
import { FolderContextSelect } from "./FolderContextSelect";

export const FolderContextFilters = ({
  effectiveSessionCourseId,
  organizations,
  selectedOrganizationId,
  selectedSessionId,
  sessionCourses,
  sessions,
  onOrganizationChange,
  onSessionChange,
  onSessionCourseChange,
}: {
  effectiveSessionCourseId: number | null;
  organizations: { id: number; name: string }[];
  selectedOrganizationId: number | null;
  selectedSessionId: number | null;
  sessionCourses: SessionCourse[];
  sessions: { id: number; name: string }[];
  onOrganizationChange: (id: number) => void;
  onSessionChange: (id: number) => void;
  onSessionCourseChange: (id: number) => void;
}) => (
  <YStack gap="$3">
    <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
      {organizations.length ? (
        <FolderContextSelect
          ariaLabel="Select organization"
          label="Organization"
          onChange={(value) => onOrganizationChange(Number(value))}
          options={organizations.map((item) => ({
            label: item.name,
            value: String(item.id),
          }))}
          value={selectedOrganizationId ? String(selectedOrganizationId) : ""}
        />
      ) : null}
      <FolderContextSelect
        ariaLabel="Select session"
        label="Session"
        onChange={(value) => onSessionChange(Number(value))}
        options={sessions.map((item) => ({
          label: item.name,
          value: String(item.id),
        }))}
        value={selectedSessionId ? String(selectedSessionId) : ""}
      />
      <FolderContextSelect
        ariaLabel="Select session course"
        label="Session course"
        onChange={(value) => onSessionCourseChange(Number(value))}
        options={sessionCourses.map((item) => ({
          label: item.displayName ?? item.course.name,
          value: String(item.id),
        }))}
        value={effectiveSessionCourseId ? String(effectiveSessionCourseId) : ""}
      />
    </XStack>
  </YStack>
);
