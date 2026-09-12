"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarDays,
  CircleHelp,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { Button, DashboardHeader, ScrollView, XStack, YStack } from "@repo/ui";

import { useAuthSession, useLogout } from "@repo/auth";
import { organizationsApi, studentsApi } from "@repo/api";

import { userHasPermission } from "@/features/shared/access";
import type { NavigationItem } from "./navigation";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

type WorkspaceKind = "admin" | "student" | "teacher";

interface WorkspaceLayoutProps {
  children: ReactNode;
  navigation: NavigationItem[];
  title: string;
  workspace: WorkspaceKind;
}

const COLORS = {
  background: "#FCFDFD",
  border: "#E1E7F0",
  navy: "#0F1D3A",
  emerald: "#059669",
  muted: "#52627A",
  profileIcon: "#435266",
  danger: "#DC2626",
};

const WORKSPACE_ROUTES = {
  admin: {
    profile: "/admin/settings",
    calendar: "/admin/sessions",
    notifications: "/admin/settings",
  },

  student: {
    profile: "/student/profile",
    calendar: "/student/schedule",
    notifications: "/student/notifications",
  },

  teacher: {
    profile: "/teacher/dashboard",
    calendar: "/teacher/courses",
    notifications: "/teacher/dashboard",
  },
} satisfies Record<
  WorkspaceKind,
  {
    profile: string;
    calendar: string;
    notifications: string;
  }
>;

const WorkspaceLayout = ({
  children,
  navigation,
  title,
  workspace,
}: WorkspaceLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const { currentUser } = useAuthSession();
  const logoutMutation = useLogout();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  /*
   * --------------------------------------------------------------------------
   * Workspace
   * --------------------------------------------------------------------------
   */

  const isAdmin = workspace === "admin";
  const isStudent = workspace === "student";
  const isTeacher = workspace === "teacher";

  const isSuperAdmin = Boolean(currentUser?.roles.includes("SUPER_ADMIN"));

  const routes = WORKSPACE_ROUTES[workspace];

  /*
   * --------------------------------------------------------------------------
   * Routes without workspace shell
   * --------------------------------------------------------------------------
   */

  const isStudentLandingRoute = pathname === "/student";

  const isExamAttemptRoute = /^\/student\/exam-attempts\/[^/]+\/?$/.test(
    pathname,
  );

  const shouldHideWorkspaceShell = isStudentLandingRoute || isExamAttemptRoute;

  /*
   * --------------------------------------------------------------------------
   * Navigation
   * --------------------------------------------------------------------------
   */

  const visibleNavigation = navigation.filter((item) => {
    const hasSuperAdminAccess = !item.superAdminOnly || isSuperAdmin;

    const hasPermission =
      !item.permission || userHasPermission(currentUser, item.permission);

    return hasSuperAdminAccess && hasPermission;
  });

  /*
   * --------------------------------------------------------------------------
   * Organization
   * --------------------------------------------------------------------------
   */

  const organizationQuery = useQuery({
    enabled: isAdmin && currentUser?.organizationId != null,

    queryFn: () =>
      organizationsApi.findOne(currentUser?.organizationId as number),

    queryKey: ["workspace-organization", currentUser?.organizationId],

    staleTime: 60_000,
  });

  /*
   * --------------------------------------------------------------------------
   * Student dashboard
   * --------------------------------------------------------------------------
   */

  const studentDashboardQuery = useQuery({
    enabled: isStudent && !isStudentLandingRoute && currentUser != null,

    queryFn: studentsApi.findMyDashboard,

    queryKey: ["student-dashboard"],

    staleTime: 60_000,
  });

  /*
   * --------------------------------------------------------------------------
   * Student notifications
   * --------------------------------------------------------------------------
   */

  const unreadNotificationsQuery = useQuery({
    enabled: isStudent && !isStudentLandingRoute && currentUser != null,

    queryFn: studentsApi.findMyUnreadNotificationCount,

    queryKey: ["student-notifications", "unread-count"],

    staleTime: 30_000,

    refetchInterval: 60_000,
  });

  const unreadNotificationCount = unreadNotificationsQuery.data?.unread ?? 0;

  /*
   * --------------------------------------------------------------------------
   * Profile
   * --------------------------------------------------------------------------
   */

  const studentProfile = studentDashboardQuery.data?.student;

  const fallbackProfileName = currentUser
    ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ")
    : "User";

  const profile = {
    name: studentProfile?.name ?? fallbackProfileName,

    role:
      studentProfile?.batch ??
      currentUser?.role ??
      currentUser?.roles?.[0] ??
      (isStudent ? "Student" : "Admin"),
  };

  /*
   * --------------------------------------------------------------------------
   * Organization label
   * --------------------------------------------------------------------------
   */

  const organizationLabel = !isAdmin
    ? undefined
    : (organizationQuery.data?.name ??
      (currentUser?.organizationId ? "Organization" : "All organizations"));

  /*
   * --------------------------------------------------------------------------
   * Handlers
   * --------------------------------------------------------------------------
   */

  const openMobileNavigation = () => {
    setIsMobileNavOpen(true);
  };

  const closeMobileNavigation = () => {
    setIsMobileNavOpen(false);
  };

  const handleProfilePress = () => {
    router.push(routes.profile);
  };

  const handleOrganizationPress = () => {
    if (isAdmin && isSuperAdmin) {
      router.push("/admin/organizations");
      return;
    }

    router.push(routes.profile);
  };

  const handleTeacherSearch = (value: string) => {
    const search = value.trim();

    if (!search) {
      router.push("/teacher/resources");
      return;
    }

    router.push(`/teacher/resources?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    if (logoutMutation.isPending) {
      return;
    }

    void logoutMutation.mutateAsync();
  };

  /*
   * --------------------------------------------------------------------------
   * Header actions
   * --------------------------------------------------------------------------
   */

  const headerActions = isStudent
    ? [
        {
          icon: (
            <CalendarDays color={COLORS.emerald} size={20} strokeWidth={2.1} />
          ),
          label: "Open calendar",
          onPress: () => router.push(routes.calendar),
        },

        {
          icon: <Bell color={COLORS.navy} size={20} strokeWidth={2.1} />,
          label: "View notifications",
          notificationCount: unreadNotificationCount,
          onPress: () => router.push(routes.notifications),
        },
      ]
    : [
        {
          icon: <CircleHelp color={COLORS.navy} size={20} strokeWidth={2.1} />,
          label: "Open help",
          onPress: handleProfilePress,
        },
      ];

  /*
   * --------------------------------------------------------------------------
   * Profile dropdown actions
   * --------------------------------------------------------------------------
   */

  const profileActions = [
    {
      icon: (
        <UserRound aria-hidden="true" color={COLORS.profileIcon} size={15} />
      ),

      id: "profile",
      label: "Profile",
      onPress: handleProfilePress,
    },

    {
      closeOnPress: false,
      destructive: true,
      disabled: logoutMutation.isPending,

      icon: (
        <LogOut
          aria-hidden="true"
          color={COLORS.danger}
          size={15}
          strokeWidth={2.1}
        />
      ),

      id: "logout",

      label: logoutMutation.isPending ? "Logging out" : "Logout",

      loading: logoutMutation.isPending,

      onPress: handleLogout,
    },
  ];

  /*
   * --------------------------------------------------------------------------
   * Workspace CSS classes
   * --------------------------------------------------------------------------
   */

  const workspaceClassName = [
    "lms-workspace-shell",

    isAdmin && "lms-admin-workspace",

    isStudent && "lms-student-workspace",

    isTeacher && "lms-teacher-workspace",
  ]
    .filter(Boolean)
    .join(" ");

  /*
   * --------------------------------------------------------------------------
   * Standalone pages
   * --------------------------------------------------------------------------
   */

  if (shouldHideWorkspaceShell) {
    return <>{children}</>;
  }

  /*
   * --------------------------------------------------------------------------
   * Render
   * --------------------------------------------------------------------------
   */

  return (
    <XStack
      className={workspaceClassName}
      style={{
        backgroundColor: COLORS.background,
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      {/* Desktop sidebar */}

      <WorkspaceSidebar navigation={visibleNavigation} title={title} />

      {/* Mobile sidebar */}

      <WorkspaceSidebar
        isMobileOpen={isMobileNavOpen}
        navigation={visibleNavigation}
        onMobileClose={closeMobileNavigation}
        title={title}
        variant="mobile"
      />

      {/* Main workspace */}

      <YStack
        className="lms-workspace-main"
        flex={1}
        style={{
          backgroundColor: COLORS.background,
          height: "100dvh",
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <DashboardHeader
          actions={headerActions}
          leadingAction={
            <Button
              aria-label="Open navigation"
              background="#FFFFFF"
              borderColor={COLORS.border as any}
              borderWidth={1}
              height={44}
              onPress={openMobileNavigation}
              rounded="$4"
              width={44}
            >
              <Menu aria-hidden="true" color={COLORS.navy} size={20} />
            </Button>
          }
          onSearchSubmit={isTeacher ? handleTeacherSearch : undefined}
          organizationIcon={
            <Building2 color={COLORS.muted} size={20} strokeWidth={2} />
          }
          organizationLabel={organizationLabel}
          organizationOnPress={handleOrganizationPress}
          profile={profile}
          profileActions={profileActions}
          profileOnPress={handleProfilePress}
          searchPlaceholder={
            isTeacher
              ? "Search your courses, resources, or students..."
              : undefined
          }
          shortcutLabel="⌘ K"
        />

        <ScrollView className="lms-workspace-scroll" flex={1}>
          <YStack
            className="lms-workspace-content"
            p="$5"
            style={{
              backgroundColor: COLORS.background,
              minHeight: "100%",
              minWidth: 0,
              width: "100%",
            }}
          >
            {children}
          </YStack>
        </ScrollView>
      </YStack>
    </XStack>
  );
};

export default WorkspaceLayout;
