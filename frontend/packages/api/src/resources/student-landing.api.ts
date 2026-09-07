import type {
  ApiResponse,
  CreateStudentLandingCardRequest,
  StudentLandingCard,
  UpdateStudentLandingCardRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const ENDPOINT = "/student-landing-cards";

export const studentLandingApi = {
  listAdmin(organizationId: number) {
    return api
      .get<ApiResponse<StudentLandingCard[]>>(`${ENDPOINT}/admin`, {
        params: { organizationId },
      })
      .then(unwrapApiData);
  },
  create(organizationId: number, payload: CreateStudentLandingCardRequest) {
    return api
      .post<ApiResponse<StudentLandingCard>>(`${ENDPOINT}/admin`, payload, {
        params: { organizationId },
      })
      .then(unwrapApiData);
  },
  update(id: number, payload: UpdateStudentLandingCardRequest) {
    return api
      .patch<ApiResponse<StudentLandingCard>>(
        `${ENDPOINT}/admin/${id}`,
        payload,
      )
      .then(unwrapApiData);
  },
  uploadImage(id: number, file: File) {
    const payload = new FormData();
    payload.append("file", file);
    return api
      .post<ApiResponse<StudentLandingCard>>(
        `${ENDPOINT}/admin/${id}/image`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then(unwrapApiData);
  },
  deleteImage(id: number) {
    return api
      .delete<ApiResponse<StudentLandingCard>>(`${ENDPOINT}/admin/${id}/image`)
      .then(unwrapApiData);
  },
  remove(id: number) {
    return api
      .delete<ApiResponse<StudentLandingCard>>(`${ENDPOINT}/admin/${id}`)
      .then(unwrapApiData);
  },
  reorder(organizationId: number, cardIds: number[]) {
    return api
      .patch<ApiResponse<StudentLandingCard[]>>(
        `${ENDPOINT}/admin/reorder`,
        { cardIds },
        { params: { organizationId } },
      )
      .then(unwrapApiData);
  },
  listStudent() {
    return api
      .get<ApiResponse<StudentLandingCard[]>>(`${ENDPOINT}/student`)
      .then(unwrapApiData);
  },
  recordView(clientEventId: string) {
    return api
      .post<ApiResponse<{ eventUuid: string; occurredAt: string }>>(
        `${ENDPOINT}/student/view`,
        { clientEventId },
      )
      .then(unwrapApiData);
  },
  recordClick(cardUuid: string, clientEventId: string) {
    return api
      .post<ApiResponse<{ eventUuid: string; occurredAt: string }>>(
        `${ENDPOINT}/student/${cardUuid}/click`,
        { clientEventId },
      )
      .then(unwrapApiData);
  },
};
