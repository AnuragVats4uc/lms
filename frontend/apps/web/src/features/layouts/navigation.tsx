import type { ComponentType } from "react";
import {
  Bell,
  BookOpen,
  Building2,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  CalendarRange,
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
    permission: "course.read",
  },
  {
    href: "/admin/session-courses",
    icon: BookOpen,
    label: "Session Courses",
    permission: "session-course.read",
  },
  {
    href: "/admin/folders",
    icon: FileText,
    label: "Folders",
    permission: "folder.read",
  },
  {
    href: "/admin/sessions",
    icon: CalendarRange,
    label: "Sessions",
    permission: "session.read",
  },
  {
    href: "/admin/resources",
    icon: FileText,
    label: "Resources",
    permission: "resource.read",
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
    href: "/student/notifications",
    icon: Bell,
    label: "Notifications",
  },
  {
    href: "/student/resources",
    icon: FileText,
    label: "Resources",
  },
  {
    href: "/student/courses",
    icon: GraduationCap,
    label: "Courses",
  },
];
