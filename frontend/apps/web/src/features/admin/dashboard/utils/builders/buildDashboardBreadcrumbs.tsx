import { BookOpen, Building2, CalendarDays, Folder } from "lucide-react";
import type { BreadcrumbItem } from "@repo/ui/dashboard";
import type { DashboardData } from "@repo/types";

export const buildDashboardBreadcrumbs = (
  data: DashboardData,
): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [];
  if (data.context.organization) {
    items.push({
      icon: <Building2 size={22} strokeWidth={2.2} />,
      label: data.context.organization.name,
      subtitle: "Organization",
    });
  }
  if (data.context.session) {
    items.push({
      icon: <CalendarDays size={22} strokeWidth={2.2} />,
      label: data.context.session.name,
      subtitle: "Session",
    });
  }
  if (data.context.course) {
    items.push({
      icon: <BookOpen size={22} strokeWidth={2.2} />,
      label: data.context.course.name,
      subtitle: "Course",
    });
  }
  if (data.context.folder) {
    items.push({
      icon: <Folder size={22} strokeWidth={2.2} />,
      label: data.context.folder.name,
      subtitle: "Folder",
    });
  }
  return [
    ...items,
    {
      icon: <Folder size={22} strokeWidth={2.2} />,
      label: "Resource Home",
      subtitle: "Manage Content",
    },
  ];
};
