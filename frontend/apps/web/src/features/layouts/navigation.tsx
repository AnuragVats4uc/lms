import type { ComponentType } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

export interface NavigationItem {
  children?: NavigationItem[];
  group?: string;
  href: string;
  icon: ComponentType<{
    color?: string;
    size?: number;
    strokeWidth?: number;
  }>;
  label: string;
  permission?: string;
}

export const adminNavigation: NavigationItem[] = [
  {
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/admin/organizations",
    icon: Building2,
    label: "Organizations",
    permission: "organizations.read",
  },
  {
    href: "/admin/users",
    icon: UsersRound,
    label: "Users",
    permission: "students.read",
  },
  {
    href: "/admin/roles",
    icon: ShieldCheck,
    label: "Roles",
    permission: "roles.read",
  },
  {
    href: "/admin/permissions",
    icon: KeyRound,
    label: "Permissions",
    permission: "permissions.read",
  },
  {
    href: "/admin/courses",
    icon: GraduationCap,
    label: "Courses",
  },
  {
    href: "/admin/resources",
    icon: FileText,
    label: "Resources",
  },
  // {
  //   href: "/admin/attendance",
  //   icon: ClipboardCheck,
  //   label: "Attendance",
  // },
  // {
  //   href: "/admin/reports",
  //   icon: FileBarChart,
  //   label: "Reports",
  // },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Settings",
  },
];

export const studentNavigation: NavigationItem[] = [
  {
    href: "/student/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/student/my-courses",
    icon: BookOpen,
    label: "My Courses",
  },
  {
    href: "/student/assignments",
    icon: FileText,
    label: "Assignments",
  },
  {
    href: "/student/resources",
    icon: FileText,
    label: "Resources",
  },
  {
    href: "/student/attendance",
    icon: ClipboardCheck,
    label: "Attendance",
  },
  {
    href: "/student/schedule",
    icon: CalendarDays,
    label: "Schedule",
  },
  {
    href: "/student/exams",
    icon: ShieldCheck,
    label: "Exams",
  },
  {
    href: "/student/notifications",
    icon: Bell,
    label: "Notifications",
  },
  {
    href: "/student/profile",
    icon: UserRound,
    label: "Profile",
  },
];
