import { createElement } from "react";
import { Ellipsis, ShieldCheck, UserCog, Users, UserRound } from "lucide-react";
import type { RoleCardProps } from "@repo/ui/dashboard";

export const dashboardRoles: RoleCardProps[] = [
  {
    actions: [{ label: "Edit" }, { icon: createElement(Ellipsis, { size: 15 }), label: "More" }],
    badge: "All Permissions",
    badgeTone: "green",
    description: "Full platform access with all permissions and settings.",
    icon: createElement(ShieldCheck, { size: 42, strokeWidth: 2.2 }),
    permissions: "All modules",
    role: "Super Admin",
  },
  {
    actions: [{ label: "Edit" }, { icon: createElement(Ellipsis, { size: 15 }), label: "More" }],
    badge: "High Access",
    badgeTone: "blue",
    description: "Manage organization, users, courses, resources and reports.",
    icon: createElement(UserCog, { size: 42, strokeWidth: 2.2 }),
    permissions: "Organization scope",
    role: "Organization Admin",
  },
  {
    actions: [{ label: "Edit" }, { icon: createElement(Ellipsis, { size: 15 }), label: "More" }],
    badge: "Content Access",
    badgeTone: "purple",
    description: "Create and manage courses, content, sessions and students.",
    icon: createElement(Users, { size: 42, strokeWidth: 2.2 }),
    permissions: "Academic modules",
    role: "Instructor",
  },
  {
    actions: [{ label: "Edit" }, { icon: createElement(Ellipsis, { size: 15 }), label: "More" }],
    badge: "Limited Access",
    badgeTone: "orange",
    description: "Access enrolled courses, content and participate.",
    icon: createElement(UserRound, { size: 42, strokeWidth: 2.2 }),
    permissions: "Learning modules",
    role: "Student",
  },
];
