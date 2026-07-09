export interface LoginDto {
  email: string;
  password: string;
}

export type RegisterGender = "MALE" | "FEMALE" | "OTHER";

export interface RegisterDto {
  firstName: string;
  lastName: string;
  className: string;
  gender: RegisterGender;
  email: string;
  mobile: string;
  state: string;
  city: string;
  address: string;
  password: string;
}

export interface Student {
  id: string;
  name?: string;
  className?: string;
  gender?: string;
  email: string | null;
  mobile: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: boolean | string;
  authStatus?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  profile: unknown;
}

export interface LoginData {
  student: Student;
  accessToken: string;
  refreshToken: string;
}

export interface ImpersonationLog {
  id: string;
  adminUserId: string;
  studentId: string;
  tokenId: string | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: string;
  endedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartStudentImpersonationDto {
  reason?: string;
}

export interface StartStudentImpersonationData
  extends LoginData {
  impersonation: ImpersonationLog;
  redirectUrl: string;
}

export interface CurrentImpersonationData {
  isImpersonating: boolean;
  adminUserId?: string;
  studentId?: string;
  studentName?: string;
  startedAt?: string;
  expiresAt?: string;
  reason?: string | null;
}

export interface StopImpersonationData {
  isImpersonating: false;
  impersonation: ImpersonationLog | null;
  message: string;
  returnTo?: string;
}

export interface RegisterData {
  student: Student;
  message: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type AuthStatus =
  | "idle"
  | "initializing"
  | "authenticated"
  | "unauthenticated";
