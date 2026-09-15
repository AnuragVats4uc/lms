import {
  BookOpen,
  Building2,
  CalendarDays,
  Folder,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import type { DashboardRole, DashboardTreeNode } from "@repo/types";

export const getDashboardRoleIcon = (role: DashboardRole) => {
  if (role.code === "SUPER_ADMIN") return <ShieldCheck aria-hidden="true" />;
  if (role.code === "ADMIN") return <UserCog aria-hidden="true" />;
  if (role.code === "INSTRUCTOR") return <Users aria-hidden="true" />;
  return <UserRound aria-hidden="true" />;
};

export const getDashboardTreeIcon = (node: DashboardTreeNode) => {
  if (node.type === "organization") {
    return <Building2 size={15} strokeWidth={2.2} />;
  }
  if (node.type === "session") {
    return <CalendarDays size={15} strokeWidth={2.2} />;
  }
  if (node.type === "course") {
    return <BookOpen size={15} strokeWidth={2.2} />;
  }
  return <Folder size={14} strokeWidth={2.2} />;
};
