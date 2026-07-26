export type CurrentUser = {
  userId: number;

  email: string;

  organizationId?: number | null;

  roles?: string[];

  permissions?: string[];
};
