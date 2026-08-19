import type { PaginatedData } from "./api";

export const RESOURCE_TYPE_IDS = {
  DOCUMENT: 1,
  VIDEO: 2,
  EXAM: 3,
} as const;

export type ResourceTypeId =
  (typeof RESOURCE_TYPE_IDS)[keyof typeof RESOURCE_TYPE_IDS];
export type ResourceTypeCode = "DOCUMENT" | "VIDEO" | "EXAM";

export interface ResourceType {
  id: ResourceTypeId;
  code: ResourceTypeCode;
  name: string;
  description: string | null;
  isActive: boolean;
}
export type ResourceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Resource {
  id: number;
  uuid: string;
  folderId: number;
  title: string;
  description: string | null;
  resourceTypeId: ResourceTypeId;
  resourceType: ResourceType;
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
  resourceTypeId: ResourceTypeId;
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
  resourceTypeId?: ResourceTypeId;
  status?: ResourceStatus;
  published?: boolean;
}

export type ResourceList = PaginatedData<Resource>;
