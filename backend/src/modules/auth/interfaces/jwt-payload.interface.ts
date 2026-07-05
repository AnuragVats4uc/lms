
export interface JwtPayload {
  sub: number;

  email?: string;

  enrollmentNo?: string;

  role?:string;
}