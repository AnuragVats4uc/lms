import { PaginatedData, PaginationQuery } from "./api";

export type OrganizationStatus = "ACTIVE" | "INACTIVE";

export interface Organization {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: OrganizationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: OrganizationStatus;
}

export interface UpdateOrganizationRequest
  extends Partial<CreateOrganizationRequest> {
  isActive?: boolean;
}

export interface OrganizationQuery extends PaginationQuery {
  status?: OrganizationStatus;
}

export type OrganizationList = PaginatedData<Organization>;
