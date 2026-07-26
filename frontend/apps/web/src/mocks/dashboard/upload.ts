import { createElement } from "react";
import { UploadCloud } from "lucide-react";
import type { UploadDropzoneProps } from "@repo/ui/dashboard";

export const dashboardUpload: UploadDropzoneProps = {
  actionLabel: "Upload Files",
  description:
    "Drag and drop files here, or click to browse. Supports: PDF, DOCX, PPTX, MP4, MOV, ZIP and more.",
  icon: createElement(UploadCloud, {
    "aria-hidden": true,
    size: 42,
    strokeWidth: 2.2,
  }),
  title: "Upload resources to this course",
};
