import type { PaginatedData } from "./api";

export type FolderStatus = "ACTIVE" | "ARCHIVED";

export interface Folder {
  id: number;
  uuid: string;
  sessionCourseId: number;
  parentFolderId: number | null;
  name: string;
  description: string | null;
  sortOrder: number;
  icon: string | null;
  color: string | null;
  status: FolderStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parentFolderId?: number;
  sortOrder?: number;
  icon?: string;
  color?: string;
  status?: FolderStatus;
}

export interface UpdateFolderRequest extends Omit<Partial<CreateFolderRequest>, "parentFolderId"> {
  parentFolderId?: number | null;
  isActive?: boolean;
}

export interface FolderQuery {
  page?: number;
  limit?: number;
  search?: string;
  parentFolderId?: number;
  status?: FolderStatus;
}

export type FolderList = PaginatedData<Folder>;
