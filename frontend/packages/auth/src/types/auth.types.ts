export interface LoginDto {
  email: string;
  password: string;
}

export interface Student {
  id: string;
  email: string;
  mobile: string | null;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: unknown;
}

export interface LoginData {
  student: Student;
  accessToken: string;
  refreshToken: string;
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
