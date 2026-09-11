import type {
  AdminStudentDashboardBanner,
  ApiResponse,
  DashboardBannerEventType,
  SaveStudentDashboardBannerRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const ENDPOINT = "/student-dashboard-banners";

export const studentDashboardBannersApi = {
  listAdmin(organizationId: number, sessionId?: number) {
    return api
      .get<ApiResponse<AdminStudentDashboardBanner[]>>(`${ENDPOINT}/admin`, {
        params: { organizationId, sessionId },
      })
      .then(unwrapApiData);
  },
  create(organizationId: number, payload: SaveStudentDashboardBannerRequest) {
    return api
      .post<ApiResponse<AdminStudentDashboardBanner>>(
        `${ENDPOINT}/admin`,
        payload,
        {
          params: { organizationId },
        },
      )
      .then(unwrapApiData);
  },
  update(id: number, payload: SaveStudentDashboardBannerRequest) {
    return api
      .patch<ApiResponse<AdminStudentDashboardBanner>>(
        `${ENDPOINT}/admin/${id}`,
        payload,
      )
      .then(unwrapApiData);
  },
  remove(id: number) {
    return api
      .delete<ApiResponse<unknown>>(`${ENDPOINT}/admin/${id}`)
      .then(unwrapApiData);
  },
  reorder(organizationId: number, sessionId: number, bannerIds: number[]) {
    return api
      .patch<ApiResponse<AdminStudentDashboardBanner[]>>(
        `${ENDPOINT}/admin/reorder`,
        { bannerIds },
        { params: { organizationId, sessionId } },
      )
      .then(unwrapApiData);
  },
  uploadImage(id: number, kind: "media" | "poster", file: File) {
    const body = new FormData();
    body.append("file", file);
    return api
      .post<ApiResponse<AdminStudentDashboardBanner>>(
        `${ENDPOINT}/admin/${id}/${kind}`,
        body,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      )
      .then(unwrapApiData);
  },
  loadMedia(url: string) {
    return api
      .get<Blob>(url, { responseType: "blob" })
      .then((response) => response.data);
  },
  recordEvent(
    bannerUuid: string,
    eventType: DashboardBannerEventType,
    clientEventId: string,
    videoPositionSeconds?: number,
  ) {
    return api
      .post<ApiResponse<{ eventUuid: string; occurredAt: string }>>(
        `${ENDPOINT}/student/${bannerUuid}/event`,
        { clientEventId, eventType, videoPositionSeconds },
      )
      .then(unwrapApiData);
  },
};
