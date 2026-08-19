import { z } from "zod/v4";

const resourceTypeId = z.enum(["1", "2", "3"]);

const optionalUrl = z.string().trim().url("Enter a valid URL").or(z.literal(""));
const optionalNonNegativeInteger = (message: string) =>
  z.string().trim().refine(
    (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 0),
    message,
  );

export const resourceSchema = z
  .object({
    description: z.string().trim().max(2000),
    documentFile: z.custom<File | null>((value) =>
      value === null || (typeof value === "object" && value !== null),
    ),
    documentSource: z.enum(["URL", "UPLOAD"]),
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
    resourceTypeId,
    videoUrl: optionalUrl,
  })
  .superRefine((value, context) => {
    if (value.resourceTypeId === "1" && value.documentSource === "URL" && !value.documentUrl) {
      context.addIssue({ code: "custom", message: "Document URL is required", path: ["documentUrl"] });
    }
    if (value.resourceTypeId === "1" && value.documentSource === "UPLOAD" && !value.documentFile) {
      context.addIssue({ code: "custom", message: "Select a document file", path: ["documentFile"] });
    }
    if (value.resourceTypeId === "2" && !value.videoUrl) {
      context.addIssue({ code: "custom", message: "Video URL is required", path: ["videoUrl"] });
    }
    if (value.resourceTypeId === "2" && value.videoUrl && !isSupportedVideoUrl(value.videoUrl)) {
      context.addIssue({
        code: "custom",
        message: "Use a valid YouTube or Vimeo URL",
        path: ["videoUrl"],
      });
    }
    if (value.resourceTypeId === "3" && !value.examId) {
      context.addIssue({ code: "custom", message: "A valid exam ID is required", path: ["examId"] });
    }
  });

function isSupportedVideoUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    return (
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "vimeo.com" ||
      hostname.endsWith(".vimeo.com")
    );
  } catch {
    return false;
  }
}

export type ResourceFormValues = z.infer<typeof resourceSchema>;
