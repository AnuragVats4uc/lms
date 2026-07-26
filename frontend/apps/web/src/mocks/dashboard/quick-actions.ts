import { createElement } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  UploadCloud,
  Zap,
} from "lucide-react";
import type { QuickActionsProps } from "@repo/ui/dashboard";

export const dashboardQuickActions: QuickActionsProps = {
  icon: createElement(Zap, {
    "aria-hidden": true,
    size: 18,
    strokeWidth: 2.2,
  }),
  title: "Quick Actions",
  actions: [
    {
      icon: createElement(Building2, {
        "aria-hidden": true,
        size: 22,
        strokeWidth: 2.2,
      }),
      label: "Add Organization",
    },
    {
      icon: createElement(CalendarDays, {
        "aria-hidden": true,
        size: 22,
        strokeWidth: 2.2,
      }),
      label: "Add Session",
    },
    {
      icon: createElement(BookOpen, {
        "aria-hidden": true,
        size: 22,
        strokeWidth: 2.2,
      }),
      label: "Create Course",
    },
    {
      icon: createElement(UploadCloud, {
        "aria-hidden": true,
        size: 22,
        strokeWidth: 2.2,
      }),
      label: "Upload Resource",
    },
  ],
};
