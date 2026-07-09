export type CurrentUser = {
  id: number;

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
};
