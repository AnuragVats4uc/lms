import { z } from "zod/v4";

const optionalText = (max: number) =>
  z.string().trim().max(max).or(z.literal(""));

export const organizationSchema = z.object({
  address: optionalText(500),
  code: z
    .string()
    .trim()
    .min(2, "Organization code is required")
    .max(20, "Organization code must be 20 characters or fewer")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Use uppercase letters, numbers, hyphens, or underscores",
    ),
  description: optionalText(1000),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .or(z.literal("")),
  name: z
    .string()
    .trim()
    .min(3, "Organization name must be at least 3 characters")
    .max(120, "Organization name must be 120 characters or fewer"),
  phone: optionalText(30),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  website: z
    .string()
    .trim()
    .url("Enter a valid website URL")
    .or(z.literal("")),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
