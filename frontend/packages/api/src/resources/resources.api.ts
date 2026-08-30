import type {
  ApiResponse,
  CreateResourceRequest,
  Resource,
  ResourceList,
  ResourceQuery,
  ResourceType,
  UpdateResourceRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

function endpoint(folderId: number) {
  return "/folders/" + folderId + "/resources";
}

const RESOURCE_UPLOAD_TIMEOUT_MS = 180_000;

export const resourcesApi = {
  findTypes() {
    return api
      .get<ApiResponse<ResourceType[]>>("/resource-types")
      .then(unwrapApiData);
  },
  create(folderId: number, payload: CreateResourceRequest) {
    return api
      .post<ApiResponse<Resource>>(endpoint(folderId), payload)
      .then(unwrapApiData);
  },
  uploadDocument(folderId: number, payload: FormData) {
    return api
      .post<ApiResponse<Resource>>(endpoint(folderId) + "/upload", payload, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: RESOURCE_UPLOAD_TIMEOUT_MS,
      })
      .then(unwrapApiData);
  },
  findAll(folderId: number, query?: ResourceQuery) {
    return api
      .get<ApiResponse<ResourceList>>(endpoint(folderId), { params: query })
      .then(unwrapApiData);
  },
  findOne(folderId: number, resourceId: number) {
    return api
      .get<ApiResponse<Resource>>(endpoint(folderId) + "/" + resourceId)
      .then(unwrapApiData);
  },
  update(folderId: number, resourceId: number, payload: UpdateResourceRequest) {
    return api
      .patch<ApiResponse<Resource>>(
        endpoint(folderId) + "/" + resourceId,
        payload,
      )
      .then(unwrapApiData);
  },
  replaceDocument(folderId: number, resourceId: number, payload: FormData) {
    return api
      .patch<ApiResponse<Resource>>(
        endpoint(folderId) + "/" + resourceId + "/upload",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: RESOURCE_UPLOAD_TIMEOUT_MS,
        },
      )
      .then(unwrapApiData);
  },
  findDocumentFile(folderId: number, resourceId: number, resourceUuid: string) {
    return api
      .get<Blob>(
        endpoint(folderId) + "/" + resourceId + "/" + resourceUuid + "/file",
        { responseType: "blob" },
      )
      .then((response) => response.data);
  },
  remove(folderId: number, resourceId: number) {
    return api
      .delete<ApiResponse<Resource>>(endpoint(folderId) + "/" + resourceId)
      .then(unwrapApiData);
  },
};
