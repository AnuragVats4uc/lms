import { createElement } from "react";
import { Building2, CalendarDays, BookOpen } from "lucide-react";
import type { StatCardProps } from "@repo/ui/dashboard";

export const dashboardStatistics: StatCardProps[] = [
  {
    color: "green",
    icon: createElement(Building2, {
      "aria-hidden": true,
      size: 24,
      strokeWidth: 2.2,
    }),
    link: "Manage Organizations",
    subtitle: "Active Organizations",
    title: "Organizations",
    value: 12,
  },
  {
    color: "purple",
    icon: createElement(CalendarDays, {
      "aria-hidden": true,
      size: 24,
      strokeWidth: 2.2,
    }),
    link: "Manage Sessions",
    subtitle: "Active Sessions",
    title: "Sessions",
    value: 24,
  },
  {
    color: "blue",
    icon: createElement(BookOpen, {
      "aria-hidden": true,
      size: 24,
      strokeWidth: 2.2,
    }),
    link: "Manage Courses",
    subtitle: "Published Courses",
    title: "Courses",
    value: 156,
  },
];
