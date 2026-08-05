import { z } from "zod/v4";

export const courseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Course code is required")
    .max(30, "Course code must be 30 characters or fewer")
    .regex(/^[A-Z0-9_-]+$/, "Use uppercase letters, numbers, hyphens, or underscores"),
  description: z.string().trim().max(2000),
  durationInDays: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) > 0),
      "Duration must be a positive whole number",
    ),
  name: z.string().trim().min(3, "Course name must be at least 3 characters").max(150),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
  thumbnail: z.string().trim().url("Enter a valid thumbnail URL").or(z.literal("")),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
