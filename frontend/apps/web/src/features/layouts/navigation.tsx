import type { ComponentType } from "react";
import {
  Bell,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldCheck,
  CalendarRange,
  Layers3,
  Library,
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
  superAdminOnly?: boolean;
}

export const adminNavigation: NavigationItem[] = [
  {
    group: "General",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    group: "User & Access",
    href: "/admin/organizations",
    icon: Building2,
    label: "Organizations",
    permission: "organizations.read",
    superAdminOnly: true,
  },
  {
    group: "User & Access",
    href: "/admin/students",
    icon: UsersRound,
    label: "Students",
    permission: "students.read",
  },
  {
    group: "User & Access",
    href: "/admin/users",
    icon: UsersRound,
    label: "Users",
    permission: "users.read",
    superAdminOnly: true,
  },
  {
    group: "User & Access",
    href: "/admin/roles",
    icon: ShieldCheck,
    label: "Roles",
    permission: "roles.read",
  },
  {
    group: "User & Access",
    href: "/admin/permissions",
    icon: KeyRound,
    label: "Permissions",
    permission: "permissions.read",
  },
  {
    group: "Learning Management",
    href: "/admin/courses",
    icon: GraduationCap,
    label: "Courses",
    permission: "course.read",
  },
  {
    group: "Learning Management",
    href: "/admin/session-courses",
    icon: BookOpen,
    label: "Session Courses",
    permission: "session-course.read",
  },
  {
    group: "Learning Management",
    href: "/admin/folders",
    icon: FileText,
    label: "Folders",
    permission: "folder.read",
  },
  {
    group: "Learning Management",
    href: "/admin/sessions",
    icon: CalendarRange,
    label: "Sessions",
    permission: "session.read",
  },
  {
    group: "Learning Management",
    href: "/admin/student-registration",
    icon: ClipboardList,
    label: "Student Registration",
    permission: "organizations.read",
  },
  {
    group: "Learning Management",
    href: "/admin/education-options",
    icon: GraduationCap,
    label: "Education Options",
    permission: "organizations.read",
  },
  {
    group: "Learning Management",
    href: "/admin/digital-library-locations",
    icon: MapPin,
    label: "Library Locations",
    permission: "organizations.read",
  },
  {
    group: "Learning Management",
    href: "/admin/resources",
    icon: FileText,
    label: "Resources",
    permission: "resource.read",
  },
  {
    group: "Assessment Management",
    href: "/admin/exams/templates",
    icon: FileText,
    label: "Exams",
    permission: "exam-template.read",
    children: [
      {
        href: "/admin/exams/templates",
        icon: Layers3,
        label: "Templates",
      },
      {
        href: "/admin/exams/subjects",
        icon: Library,
        label: "Subjects",
      },
      {
        href: "/admin/exams/topics",
        icon: Layers3,
        label: "Topics",
      },
      {
        href: "/admin/exams/questions",
        icon: ClipboardList,
        label: "Question Bank",
      },
      {
        href: "/admin/exams/schedule",
        icon: CalendarRange,
        label: "Schedule Exams",
      },
      {
        href: "/admin/exams/reports",
        icon: BarChart3,
        label: "Exam Reports",
      },
    ],
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
    group: "General",
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
    href: "/student/schedule",
    icon: CalendarRange,
    label: "Calendar",
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

export const teacherNavigation: NavigationItem[] = [
  {
    href: "/teacher/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/teacher/courses",
    icon: BookOpen,
    label: "My Courses",
  },
  {
    href: "/teacher/resources",
    icon: FileText,
    label: "Resources",
  },
  {
    href: "/teacher/students",
    icon: UsersRound,
    label: "Students",
  },
];
