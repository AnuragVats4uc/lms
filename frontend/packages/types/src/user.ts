import { PaginatedData, PaginationQuery } from "./api";
import { Organization } from "./organization";
import { Role } from "./rbac";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface User {
  id: number;
  uuid: string;
  organizationId: number | null;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  status: UserStatus;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  organization?: Organization | null;
  roles?: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentRequest {
  organizationId?: number;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateStudentRequest
  extends Partial<CreateStudentRequest> {}

export interface StudentQuery extends PaginationQuery {
  organizationId?: number;
  status?: UserStatus;
}

export type Student = User;
export type StudentList = PaginatedData<Student>;
