import {
  BarChart3,
  BookOpen,
  ExternalLink,
  Pencil,
  Power,
  Trash2,
  UsersRound,
} from "lucide-react";

export const menuActions = [
  {
    destructive: false,
    icon: ExternalLink,
    id: "view",
    label: "View",
  },
  {
    destructive: false,
    icon: Pencil,
    id: "edit",
    label: "Edit",
  },
  {
    destructive: false,
    icon: UsersRound,
    id: "users",
    label: "Manage Users",
  },
  {
    destructive: false,
    icon: BookOpen,
    id: "courses",
    label: "Assign Courses",
  },
  {
    destructive: false,
    icon: BarChart3,
    id: "analytics",
    label: "View Analytics",
  },
  {
    destructive: false,
    icon: Power,
    id: "toggle",
    label: "Deactivate / Activate",
  },
  {
    destructive: true,
    icon: Trash2,
    id: "delete",
    label: "Delete",
  },
] as const;

export type OrganizationMenuActionId = (typeof menuActions)[number]["id"];
