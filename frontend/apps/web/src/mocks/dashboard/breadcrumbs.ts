import { createElement } from "react";
import { BookOpen, Building2, CalendarDays, Folder } from "lucide-react";
import type { BreadcrumbItem } from "@repo/ui/dashboard";

export const dashboardBreadcrumbs: BreadcrumbItem[] = [
  {
    icon: createElement(Building2, { size: 22, strokeWidth: 2.2 }),
    label: "Acme Corporation",
    subtitle: "Organization",
  },
  {
    icon: createElement(CalendarDays, { size: 22, strokeWidth: 2.2 }),
    label: "Spring 2025",
    subtitle: "Session",
  },
  {
    icon: createElement(BookOpen, { size: 22, strokeWidth: 2.2 }),
    label: "Data Structures",
    subtitle: "Course",
  },
  {
    icon: createElement(Folder, { size: 22, strokeWidth: 2.2 }),
    label: "Resource Home",
    subtitle: "Manage Content",
  },
];
