import { createElement } from "react";
import { Bell, Building2, CalendarDays, CircleHelp } from "lucide-react";

export const dashboardHeader = {
  actions: [
    {
      icon: createElement(CalendarDays, {
        color: "#059669",
        size: 20,
        strokeWidth: 2.1,
      }),
      label: "Open calendar",
    },
    {
      icon: createElement(Bell, {
        color: "#0F1D3A",
        size: 20,
        strokeWidth: 2.1,
      }),
      label: "View notifications",
      notificationCount: 7,
    },
    {
      icon: createElement(CircleHelp, {
        color: "#0F1D3A",
        size: 20,
        strokeWidth: 2.1,
      }),
      label: "Open help",
    },
  ],
  organizationIcon: createElement(Building2, {
    color: "#52627A",
    size: 20,
    strokeWidth: 2,
  }),
  organizationLabel: "Acme Corporation",
  profile: {
    name: "Aaray Sharma",
    role: "Super Admin",
  },
  searchPlaceholder: "Search organizations, courses, resources, users...",
};
