import { Ellipsis } from "lucide-react";
import type { RoleCardProps } from "@repo/ui/dashboard";
import type { DashboardData } from "@repo/types";

import { getDashboardRoleIcon } from "../dashboardIcons";

export const buildDashboardRoles = (
  data: DashboardData,
  navigate: (path: string) => void,
): RoleCardProps[] =>
  data.roles.map((role) => ({
    actions: [
      {
        label: "Edit",
        onPress: () => navigate(`/admin/roles?action=edit&id=${role.id}`),
      },
      {
        icon: <Ellipsis size={15} />,
        label: "More",
        onPress: () => navigate("/admin/roles"),
      },
    ],
    badge: `${role.permissionCount} permissions`,
    badgeTone: role.code === "SUPER_ADMIN" ? "green" : "blue",
    description: role.description ?? "No description available.",
    icon: getDashboardRoleIcon(role),
    permissions: `${role.userCount} assigned users`,
    role: role.name,
  }));
