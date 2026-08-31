import { z } from "zod/v4";

export const courseSchema = z.object({
  description: z.string().trim().max(2000),
  durationInDays: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) > 0),
      "Duration must be a positive whole number",
    ),
  name: z
    .string()
    .trim()
    .min(3, "Course name must be at least 3 characters")
    .max(150),
  price: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0),
      "Price must be a valid amount",
    ),
  discount: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0),
      "Discount must be a valid amount",
    ),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
  thumbnail: z
    .string()
    .trim()
    .url("Enter a valid thumbnail URL")
    .or(z.literal("")),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
