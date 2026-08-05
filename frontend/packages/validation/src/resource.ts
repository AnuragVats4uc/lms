import { z } from "zod/v4";

const optionalUrl = z.string().trim().url("Enter a valid URL").or(z.literal(""));
const optionalNonNegativeInteger = (message: string) =>
  z.string().trim().refine(
    (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 0),
    message,
  );

export const resourceSchema = z
  .object({
    description: z.string().trim().max(2000),
    documentUrl: optionalUrl,
    durationInSeconds: optionalNonNegativeInteger("Duration must be a non-negative whole number"),
    examId: z.string().trim().refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) > 0), "Exam ID must be a positive whole number"),
    fileSize: optionalNonNegativeInteger("File size must be a non-negative whole number"),
    isDownloadable: z.boolean(),
    isPublished: z.boolean(),
    mimeType: z.string().trim().max(120),
    sortOrder: z.string().trim().refine((value) => /^\d+$/.test(value) && Number(value) >= 0, "Sort order must be a non-negative whole number"),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    thumbnail: optionalUrl,
    title: z.string().trim().min(1, "Resource title is required").max(200),
    type: z.enum(["DOCUMENT", "VIDEO", "EXAM"]),
    videoUrl: optionalUrl,
  })
  .superRefine((value, context) => {
    if (value.type === "DOCUMENT" && !value.documentUrl) {
      context.addIssue({ code: "custom", message: "Document URL is required", path: ["documentUrl"] });
    }
    if (value.type === "VIDEO" && !value.videoUrl) {
      context.addIssue({ code: "custom", message: "Video URL is required", path: ["videoUrl"] });
    }
    if (value.type === "EXAM" && !value.examId) {
      context.addIssue({ code: "custom", message: "A valid exam ID is required", path: ["examId"] });
    }
  });

export type ResourceFormValues = z.infer<typeof resourceSchema>;
