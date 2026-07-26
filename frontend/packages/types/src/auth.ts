export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string | null;
  email: string;
  organizationId: number | null;
  role?: string | null;
  roles: string[];
  permissions: string[];
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokenPair {
  user: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends AuthTokenPair {
  user?: AuthUser;
}

export type AuthStatus =
  | "idle"
  | "initializing"
  | "authenticated"
  | "unauthenticated";
