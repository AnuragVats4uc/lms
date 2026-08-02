import type {
  ApiResponse,
  CreateFolderRequest,
  Folder,
  FolderList,
  FolderQuery,
  FolderTreeNode,
  UpdateFolderRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

function endpoint(sessionCourseId: number) {
  return "/session-courses/" + sessionCourseId + "/folders";
}

export const foldersApi = {
  create(sessionCourseId: number, payload: CreateFolderRequest) {
    return api.post<ApiResponse<Folder>>(endpoint(sessionCourseId), payload).then(unwrapApiData);
  },
  findAll(sessionCourseId: number, query?: FolderQuery) {
    return api.get<ApiResponse<FolderList>>(endpoint(sessionCourseId), { params: query }).then(unwrapApiData);
  },
  findTree(sessionCourseId: number) {
    return api.get<ApiResponse<FolderTreeNode[]>>(endpoint(sessionCourseId) + "/tree").then(unwrapApiData);
  },
  findOne(sessionCourseId: number, id: number) {
    return api.get<ApiResponse<Folder>>(endpoint(sessionCourseId) + "/" + id).then(unwrapApiData);
  },
  update(sessionCourseId: number, id: number, payload: UpdateFolderRequest) {
    return api.patch<ApiResponse<Folder>>(endpoint(sessionCourseId) + "/" + id, payload).then(unwrapApiData);
  },
  remove(sessionCourseId: number, id: number) {
    return api.delete<ApiResponse<Folder>>(endpoint(sessionCourseId) + "/" + id).then(unwrapApiData);
  },
};
