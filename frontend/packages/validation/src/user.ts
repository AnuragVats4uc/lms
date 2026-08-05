import { z } from "zod/v4";

export const userSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  firstName: z.string().trim().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().trim().max(100),
  organizationId: z.string().trim().refine((value) => value === "" || /^\d+$/.test(value), "Select a valid organization"),
  password: z.string().refine((value) => value === "" || value.length >= 8, "Password must be at least 8 characters"),
  phone: z.string().trim().regex(/^[+\d()\s-]{7,20}$/, "Enter a valid phone number").or(z.literal("")),
});

export type UserFormValues = z.infer<typeof userSchema>;
