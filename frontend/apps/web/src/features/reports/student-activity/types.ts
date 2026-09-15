import { StudentReportActivityType } from "@repo/types";

export type FilterState = {
  activityType: "" | StudentReportActivityType;
  from: string;
  resourceType: string;
  sessionCourseId: string;
  to: string;
};

export type ReportTab = "overview" | "timeline" | "resources" | "access";
import type { LucideIcon } from "lucide-react";
import type {
  StudentActivityDeviceBreakdown,
  StudentReportActivityCategory,
} from "@repo/types";
import type { ActivityReportTab } from "./hooks/useActivityReportTabs";

export type AggregatedDevice = {
  activeDurationSeconds: number;
  deviceType: string;
  idleDurationSeconds: number;
  sessionCount: number;
};

export type ReportTabDefinition = {
  icon: LucideIcon;
  id: ActivityReportTab;
  label: string;
};
export type DonutSegment = { color: string; label: string; value: number };
export type ActivitySummaryTone =
  "amber" | "blue" | "green" | "orange" | "red" | "violet";
export type ActivityCategoryColors = Record<
  StudentReportActivityCategory,
  string
>;
export type DeviceBreakdown = StudentActivityDeviceBreakdown;
