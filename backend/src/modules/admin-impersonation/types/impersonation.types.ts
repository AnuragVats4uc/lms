export interface AuthenticatedRequestUser {
  studentId: string;
  email?: string;
  role?: string;
  impersonation?: ImpersonationJwtPayload;
}

export interface ImpersonationJwtPayload {
  adminUserId: string;
  expiresAt: string;
  logId: string;
  studentId: string;
  tokenId: string;
}

export interface ImpersonationLogRow {
  id: string;
  adminUserId: bigint;
  studentId: bigint;
  tokenId: string | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: Date;
  endedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
