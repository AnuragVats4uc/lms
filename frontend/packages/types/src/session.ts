import { PaginatedData } from "./api";

export type SessionStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type SessionSortField =
  | "name"
  | "startDate"
  | "endDate"
  | "createdAt"
  | "updatedAt";

export type SessionSortDirection = "asc" | "desc";

export interface Session {
  id: number;
  uuid: string;
  organizationId: number;
  name: string;
  code: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  name: string;
  code?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: SessionStatus;
}

export interface UpdateSessionRequest extends Partial<CreateSessionRequest> {
  isActive?: boolean;
}

export interface SessionQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: SessionStatus;
  sort?: SessionSortField;
  order?: SessionSortDirection;
}

export type SessionList = PaginatedData<Session>;
