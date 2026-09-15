import type { Organization, Session } from "@repo/types";
import { XStack } from "@repo/ui";
import { CrudSelect } from "../../../components/crud";

export const SessionCourseContextControls = ({
  organizations,
  selectedOrganizationId,
  selectedSessionId,
  sessions,
  setOrganizationId,
  setSessionId,
}: {
  organizations: Organization[];
  selectedOrganizationId: number | null;
  selectedSessionId: number | null;
  sessions: Session[];
  setOrganizationId: (id: number) => void;
  setSessionId: (id: number | null) => void;
}) => (
  <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
    {organizations.length ? (
      <CrudSelect
        ariaLabel="Select organization"
        label="Organization"
        onChange={(value) => {
          setOrganizationId(Number(value));
          setSessionId(null);
        }}
        options={organizations.map((item) => ({
          label: item.name,
          value: String(item.id),
        }))}
        value={selectedOrganizationId ? String(selectedOrganizationId) : ""}
      />
    ) : null}
    <CrudSelect
      ariaLabel="Select session"
      label="Session"
      onChange={(value) => setSessionId(Number(value))}
      options={sessions.map((item) => ({
        label: item.name,
        value: String(item.id),
      }))}
      value={selectedSessionId ? String(selectedSessionId) : ""}
    />
  </XStack>
);
