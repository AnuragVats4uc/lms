import { sessionsApi } from "@repo/api";
import type {
  CreateSessionRequest,
  Session,
  SessionList,
  SessionQuery,
  UpdateSessionRequest,
} from "@repo/types";

export interface SessionListParams extends SessionQuery {
  limit: number;
  page: number;
}

export interface UpdateSessionInput {
  organizationId: number;
  sessionId: number;
  payload: UpdateSessionRequest;
}

export function getSessions(
  organizationId: number,
  params: SessionListParams,
): Promise<SessionList> {
  return sessionsApi.findAll(organizationId, params);
}

export function createSession(
  organizationId: number,
  payload: CreateSessionRequest,
): Promise<Session> {
  return sessionsApi.create(organizationId, payload);
}

export function updateSession({
  organizationId,
  sessionId,
  payload,
}: UpdateSessionInput): Promise<Session> {
  return sessionsApi.update(organizationId, sessionId, payload);
}

export function deleteSession(
  organizationId: number,
  sessionId: number,
): Promise<Session> {
  return sessionsApi.remove(organizationId, sessionId);
}
