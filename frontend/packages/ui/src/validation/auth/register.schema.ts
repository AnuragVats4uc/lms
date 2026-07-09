import { z } from "zod/v4";

export const registerGenderOptions = [
  "MALE",
  "FEMALE",
  "OTHER",
] as const;

export const registerClassOptions = [
  "Graduate",
  "Class 12",
  "Class 11",
  "Class 10",
] as const;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(255, "First name must be 255 characters or fewer"),

    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(255, "Last name must be 255 characters or fewer"),

    className: z.enum(registerClassOptions, {
      error: "Class is required",
    }),

    gender: z.enum(registerGenderOptions, {
      error: "Gender is required",
    }),

    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .max(255, "Email must be 255 characters or fewer"),

    mobile: z
      .string()
      .trim()
      .min(1, "Mobile number is required")
      .regex(
        /^[6-9]\d{9}$/,
        "Enter a valid 10-digit Indian mobile number"
      ),

    state: z
      .string()
      .trim()
      .min(1, "State is required"),

    city: z
      .string()
      .trim()
      .min(1, "City is required"),

    address: z
      .string()
      .trim()
      .min(8, "Address must be at least 8 characters")
      .max(500, "Address must be 500 characters or fewer"),

    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be 72 characters or fewer"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (values) => values.password === values.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export type RegisterFormValues = z.infer<
  typeof registerSchema
>;
