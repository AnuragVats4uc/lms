
export interface JwtPayload {
  sub: string;

  email?: string;

  enrollmentNo?: string;

  role?: string;

  impersonation?: {
    adminUserId: string;
    expiresAt: string;
    logId: string;
    studentId: string;
    tokenId: string;
  };
}
