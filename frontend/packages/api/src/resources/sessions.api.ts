import type {
  ApiResponse,
  CreateSessionRequest,
  Session,
  SessionList,
  SessionQuery,
  UpdateSessionRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

function sessionsEndpoint(organizationId: number) {
  return `/organizations/${organizationId}/sessions`;
}

export const sessionsApi = {
  create(organizationId: number, payload: CreateSessionRequest) {
    return api
      .post<ApiResponse<Session>>(sessionsEndpoint(organizationId), payload)
      .then(unwrapApiData);
  },

  findAll(organizationId: number, query?: SessionQuery) {
    return api
      .get<ApiResponse<SessionList>>(sessionsEndpoint(organizationId), {
        params: query,
      })
      .then(unwrapApiData);
  },

  findOne(organizationId: number, sessionId: number) {
    return api
      .get<ApiResponse<Session>>(
        `${sessionsEndpoint(organizationId)}/${sessionId}`,
      )
      .then(unwrapApiData);
  },

  update(
    organizationId: number,
    sessionId: number,
    payload: UpdateSessionRequest,
  ) {
    return api
      .patch<ApiResponse<Session>>(
        `${sessionsEndpoint(organizationId)}/${sessionId}`,
        payload,
      )
      .then(unwrapApiData);
  },

  remove(organizationId: number, sessionId: number) {
    return api
      .delete<ApiResponse<Session>>(
        `${sessionsEndpoint(organizationId)}/${sessionId}`,
      )
      .then(unwrapApiData);
  },
};
