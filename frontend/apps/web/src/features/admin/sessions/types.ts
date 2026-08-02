import type {
  Session,
  SessionSortDirection,
  SessionSortField,
  SessionStatus,
} from "@repo/types";
import type { DataTableRowId } from "@/components/DataTable";

export interface SessionFiltersState {
  organizationId: number | null;
  search: string;
  status: SessionStatus | "ALL";
  sort: SessionSortField;
  order: SessionSortDirection;
}

export interface SessionFormState {
  name: string;
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  status: SessionStatus;
}

export type SessionConfirmAction =
  | { kind: "bulk-delete"; sessions: Session[] }
  | { kind: "delete"; session: Session }
  | { kind: "toggle"; session: Session };

export interface SessionToastState {
  id: number;
  message: string;
  title: string;
  tone: "error" | "success";
}

export interface SessionRowActionHandlers {
  onDelete?: (session: Session) => void;
  onEdit?: (session: Session) => void;
  onToggleActive?: (session: Session) => void;
  onView: (session: Session) => void;
}

export interface SessionSelectionState {
  selectedRowIds: DataTableRowId[];
  selectedSessions: Session[];
}
