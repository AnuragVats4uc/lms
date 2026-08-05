import { z } from "zod/v4";

export const sessionSchema = z
  .object({
    code: z.string().trim().max(20).regex(/^[A-Z0-9_-]*$/, "Use uppercase letters, numbers, hyphens, or underscores"),
    description: z.string().trim().max(2000),
    endDate: z.string().min(1, "End date is required"),
    name: z.string().trim().min(3, "Session name must be at least 3 characters").max(120),
    startDate: z.string().min(1, "Start date is required"),
    status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "ARCHIVED"]),
  })
  .superRefine((value, context) => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    if (Number.isNaN(start.getTime())) context.addIssue({ code: "custom", message: "Enter a valid start date", path: ["startDate"] });
    if (Number.isNaN(end.getTime())) context.addIssue({ code: "custom", message: "Enter a valid end date", path: ["endDate"] });
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start >= end) {
      context.addIssue({ code: "custom", message: "End date must be after the start date", path: ["endDate"] });
    }
  });

export type SessionFormValues = z.infer<typeof sessionSchema>;
