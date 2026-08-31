import { z } from "zod/v4";

export const roleSchema = z.object({
  description: z.string().trim().max(1000),
  isActive: z.boolean(),
  name: z
    .string()
    .trim()
    .min(3, "Role name must be at least 3 characters")
    .max(120),
  organizationId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Select a valid organization",
    ),
  permissionIds: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
