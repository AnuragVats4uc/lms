
export interface JwtPayload {
  sub: number;

  email: string;

  organizationId?: number | null;

  roles: string[];
}
