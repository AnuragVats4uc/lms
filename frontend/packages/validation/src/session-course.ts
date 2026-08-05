import { z } from "zod/v4";

export const sessionCourseSchema = z.object({
  courseId: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) > 0, "Select a course"),
  description: z.string().trim().max(2000),
  displayName: z.string().trim().max(150),
  isPublished: z.boolean(),
  sortOrder: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 0, "Sort order must be a non-negative whole number"),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
});

export type SessionCourseFormValues = z.infer<typeof sessionCourseSchema>;
