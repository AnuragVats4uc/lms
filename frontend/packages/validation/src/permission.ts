import { z } from "zod/v4";

export const permissionSchema = z.object({
  action: z.string().trim().min(1, "Action is required").max(80).regex(/^[a-z0-9._-]+$/i, "Use letters, numbers, dots, hyphens, or underscores"),
  description: z.string().trim().max(1000),
  module: z.string().trim().min(1, "Module is required").max(80).regex(/^[a-z0-9._-]+$/i, "Use letters, numbers, dots, hyphens, or underscores"),
});

export type PermissionFormValues = z.infer<typeof permissionSchema>;
