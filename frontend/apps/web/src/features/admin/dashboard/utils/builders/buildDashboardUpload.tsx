import { UploadCloud } from "lucide-react";
import type { UploadDropzoneProps } from "@repo/ui/dashboard";
import type { DashboardData } from "@repo/types";

import { getDashboardResourcePath } from "../dashboardPaths";

export const buildDashboardUpload = (
  data: DashboardData,
  navigate: (path: string) => void,
): UploadDropzoneProps => ({
  actionLabel: "Upload Files",
  description:
    "Drag and drop files here, or click to browse. Supports: PDF, DOCX, PPTX, MP4, MOV, ZIP and more.",
  icon: <UploadCloud aria-hidden="true" size={42} strokeWidth={2.2} />,
  onPress: () => navigate(getDashboardResourcePath(data, undefined, "create")),
  title: "Upload resources to this course",
});
