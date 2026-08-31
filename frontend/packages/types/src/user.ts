import { PaginatedData, PaginationQuery } from "./api";
import { Organization } from "./organization";
import { Role } from "./rbac";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type StudentStatus = "ACTIVE" | "INACTIVE" | "ALUMNI" | "SUSPENDED";

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

export interface StudentProfile {
  id: number;
  uuid: string;
  studentId: number;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  avatar: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  uuid: string;
  userId: number;
  organizationId: number | null;
  studentCode: string;
  admissionNumber: string | null;
  rollNumber: string | null;
  status: StudentStatus;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: Organization | null;
  enrollments?: StudentEnrollment[];
  profile: StudentProfile | null;
  user: User | null;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  roles?: Role[];
}

export interface StudentEnrollmentCourse {
  id: number;
  courseId: number;
  name: string;
  code: string;
}

export interface StudentEnrollment {
  id: number;
  session: {
    id: number;
    name: string;
    code: string | null;
    status: string;
  };
  courses: StudentEnrollmentCourse[];
}

export interface CurrentStudent {
  user: Pick<User, "id" | "email" | "firstName" | "lastName"> & {
    roles: string[];
  };
  student: Pick<
    Student,
    "id" | "uuid" | "organizationId" | "studentCode" | "status"
  >;
  profile: StudentProfile | null;
}

export interface CreateStudentRequest {
  organizationId?: number;
  sessionId?: number;
  sessionCourseIds?: number[];
  educationOptionUuid?: string;
  digitalLibraryLocationUuid?: string;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  admissionNumber?: string;
  rollNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  avatar?: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {}

export interface StudentQuery extends PaginationQuery {
  organizationId?: number;
  status?: StudentStatus;
}

export type StudentList = PaginatedData<Student>;

export interface CreateUserRequest {
  organizationId?: number;
  roleId: number;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {}

export interface UserQuery extends PaginationQuery {
  organizationId?: number;
  status?: UserStatus;
}

export type UserList = PaginatedData<User>;
