import { StudentVideoUpNextResource } from "@repo/types";

export const formatResourceType = (resource: StudentVideoUpNextResource) => {
  if (resource.resourceType.code === "VIDEO") return "Video";
  const mimeType = resource.mimeType?.toLowerCase() ?? "";
  if (mimeType.includes("pdf")) return "PDF Document";
  return "Document";
};
