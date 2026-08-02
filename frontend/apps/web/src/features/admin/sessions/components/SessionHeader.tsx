import { CrudPageHeader } from "../../components/crud";

export interface SessionHeaderProps {
  canCreate: boolean;
  hasOrganization: boolean;
  isFetching: boolean;
  onAdd: () => void;
  onRefresh: () => void;
}

export const SessionHeader = ({
  canCreate,
  hasOrganization,
  isFetching,
  onAdd,
  onRefresh,
}: SessionHeaderProps) => (
  <CrudPageHeader
    canCreate={canCreate && hasOrganization}
    createLabel="Add Session"
    description="Manage organization academic sessions, schedules, statuses, and lifecycle from one role-aware workspace."
    isFetching={isFetching}
    onCreate={onAdd}
    onRefresh={onRefresh}
    title="Sessions"
  />
);
