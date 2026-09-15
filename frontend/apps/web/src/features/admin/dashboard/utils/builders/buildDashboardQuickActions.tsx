import {
  BookOpen,
  Building2,
  CalendarDays,
  UserRound,
  Zap,
} from "lucide-react";
import type { QuickActionsProps } from "@repo/ui/dashboard";
import type { DashboardData } from "@repo/types";

import { getDashboardSessionPath } from "../dashboardPaths";

export const buildDashboardQuickActions = (
  data: DashboardData,
  navigate: (path: string) => void,
  isSuperAdmin: boolean,
): QuickActionsProps => ({
  icon: <Zap aria-hidden="true" size={18} strokeWidth={2.2} />,
  title: "Quick Actions",
  actions: [
    ...(isSuperAdmin
      ? [
          {
            icon: <Building2 size={22} strokeWidth={2.2} />,
            label: "Add Organization",
            onPress: () => navigate("/admin/organizations?action=create"),
          },
        ]
      : []),
    {
      icon: <CalendarDays size={22} strokeWidth={2.2} />,
      label: "Add Session",
      onPress: () => navigate(getDashboardSessionPath(data, "create")),
    },
    {
      icon: <BookOpen size={22} strokeWidth={2.2} />,
      label: "Create Course",
      onPress: () => navigate("/admin/courses?action=create"),
    },
    {
      icon: <UserRound size={22} strokeWidth={2.2} />,
      label: "Register Student",
      onPress: () => navigate("/admin/students?action=create"),
    },
  ],
});
