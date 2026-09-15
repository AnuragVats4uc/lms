import { Activity, BarChart3, BookOpen, MonitorSmartphone } from "lucide-react";
import type { ActivityCategoryColors, ReportTabDefinition } from "./types";

export const reportTabs: ReportTabDefinition[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "access", label: "Access & Devices", icon: MonitorSmartphone },
];

export const categoryColors: ActivityCategoryColors = {
  AUTHENTICATION: "#059669",
  RESOURCE: "#2563eb",
  DOCUMENT: "#7c3aed",
  VIDEO: "#f97316",
  EXAM: "#e11d48",
  REPORT: "#d97706",
  LANDING: "#0891b2",
  BANNER: "#0f9f73",
  SESSION: "#94a3b8",
};
export const deviceColors = ["#059669", "#2563eb", "#8b5cf6", "#f59e0b"];
export const resourceColors: Record<string, string> = {
  VIDEO: "#059669",
  DOCUMENT: "#8b5cf6",
  EXAM: "#f97316",
};
