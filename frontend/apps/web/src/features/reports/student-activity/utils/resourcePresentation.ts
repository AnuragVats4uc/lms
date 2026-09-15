import {
  CheckCircle2,
  FileText,
  Laptop,
  MonitorSmartphone,
  Smartphone,
  Tablet,
  Video,
} from "lucide-react";
import type { StudentActivityResourceBreakdown } from "@repo/types";

export const resourceIcon = (type: string) =>
  type.toUpperCase() === "VIDEO"
    ? Video
    : type.toUpperCase() === "DOCUMENT"
      ? FileText
      : CheckCircle2;
export const resourceTone = (type: string) =>
  type.toUpperCase() === "VIDEO"
    ? "green"
    : type.toUpperCase() === "DOCUMENT"
      ? "violet"
      : "orange";
export const deviceIcon = (type: string) =>
  type.toUpperCase() === "MOBILE"
    ? Smartphone
    : type.toUpperCase() === "TABLET"
      ? Tablet
      : type.toUpperCase() === "DESKTOP"
        ? Laptop
        : MonitorSmartphone;
export const resourceKey = (
  resource: StudentActivityResourceBreakdown,
  index: number,
) =>
  `${resource.resourceId ?? resource.resourceTitle}-${resource.courseName ?? "course"}-${index}`;
