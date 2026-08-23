import { PaginatedData, PaginationQuery } from "./api";
import { Organization } from "./organization";

export interface Permission {
  id: number;
  uuid: string;
  module: string;
  action: string;
  key: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  uuid: string;
  organizationId: number | null;
  scope: string;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  organization?: Organization | null;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  organizationId: number | null;
  isActive: boolean;
  role?: Role;
  organization?: Organization | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionRequest {
  module: string;
  action: string;
  description?: string;
}

export interface PermissionQuery extends PaginationQuery {
  module?: string;
}

export interface CreateRoleRequest {
  organizationId?: number;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: number[];
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {}

export interface RoleQuery extends PaginationQuery {
  isActive?: boolean;
  organizationId?: number;
}

export interface AssignRolePermissionsRequest {
  permissionIds: number[];
}

export interface AssignUserRoleRequest {
  userId: number;
  organizationId?: number;
}

export type RoleList = PaginatedData<Role>;
export type PermissionList = PaginatedData<Permission>;
