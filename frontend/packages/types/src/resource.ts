import type { PaginatedData } from "./api";

export type ResourceType = "DOCUMENT" | "VIDEO" | "EXAM";
export type ResourceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Resource {
  id: number;
  uuid: string;
  folderId: number;
  title: string;
  description: string | null;
  type: ResourceType;
  documentUrl: string | null;
  videoUrl: string | null;
  examId: number | null;
  thumbnail: string | null;
  mimeType: string | null;
  fileSize: string | null;
  durationInSeconds: number | null;
  sortOrder: number;
  status: ResourceStatus;
  isPublished: boolean;
  isDownloadable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceRequest {
  title: string;
  description?: string;
  type: ResourceType;
  documentUrl?: string;
  videoUrl?: string;
  examId?: number;
  thumbnail?: string;
  mimeType?: string;
  fileSize?: string;
  durationInSeconds?: number;
  sortOrder?: number;
  status?: ResourceStatus;
  isPublished?: boolean;
  isDownloadable?: boolean;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  isActive?: boolean;
}

export interface ResourceQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  published?: boolean;
}

export type ResourceList = PaginatedData<Resource>;
