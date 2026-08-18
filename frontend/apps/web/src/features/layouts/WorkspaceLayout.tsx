"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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

interface WorkspaceLayoutProps {
  children: ReactNode;
  navigation: NavigationItem[];
  title: string;
}

const WorkspaceLayout = ({
  children,
  navigation,
  title,
}: WorkspaceLayoutProps) => {
  const { currentUser } = useAuthSession();
  const logoutMutation = useLogout();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isStudentWorkspace = title.toLowerCase() === "student";
  const routePrefix = isStudentWorkspace ? "/student" : "/admin";
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.permission || userHasPermission(currentUser, item.permission),
  );
  const organizationQuery = useQuery({
    enabled: !isStudentWorkspace && currentUser?.organizationId != null,
    queryFn: () => organizationsApi.findOne(currentUser?.organizationId as number),
    queryKey: ["workspace-organization", currentUser?.organizationId],
    staleTime: 60_000,
  });
  const studentDashboardQuery = useQuery({
    enabled: isStudentWorkspace && currentUser != null,
    queryFn: studentsApi.findMyDashboard,
    queryKey: ["student-dashboard"],
    staleTime: 60_000,
  });
  const profileName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName ?? ""}`.trim()
    : "User";
  const studentProfile = studentDashboardQuery.data?.student;
  const unreadStudentNotifications =
    studentDashboardQuery.data?.notifications.filter((notification) => !notification.isRead)
      .length ?? 0;
  const profileRole =
    studentProfile?.batch ??
    currentUser?.role ??
    currentUser?.roles?.[0] ??
    (isStudentWorkspace ? "Student" : "Admin");
  const headerActions = [
    {
      icon: <CalendarDays color="#059669" size={20} strokeWidth={2.1} />,
      label: "Open calendar",
    },
    {
      icon: <Bell color="#0F1D3A" size={20} strokeWidth={2.1} />,
      label: "View notifications",
      notificationCount: isStudentWorkspace ? unreadStudentNotifications : 0,
    },
    {
      icon: <CircleHelp color="#0F1D3A" size={20} strokeWidth={2.1} />,
      label: "Open help",
    },
  ].filter((action) => !isStudentWorkspace || action.label !== "Open help");
  const handleLogout = () => {
    if (logoutMutation.isPending) {
      return;
    }

    void logoutMutation.mutateAsync();
  };

  return (
    <XStack
      className="lms-workspace-shell"
      style={{
        backgroundColor: "#FCFDFD",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <WorkspaceSidebar navigation={visibleNavigation} title={title} />

      <WorkspaceSidebar
        isMobileOpen={isMobileNavOpen}
        navigation={visibleNavigation}
        onMobileClose={() => setIsMobileNavOpen(false)}
        title={title}
        variant="mobile"
      />

      <YStack
        className="lms-workspace-main"
        flex={1}
        style={{
          backgroundColor: "#FCFDFD",
          height: "100vh",
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <DashboardHeader
          actions={headerActions.map((action) => ({
            ...action,
            onPress: () => {
              if (action.label === "Open calendar") {
                router.push(isStudentWorkspace ? "/student/schedule" : "/admin/sessions");
              } else if (action.label === "View notifications") {
                router.push(
                  isStudentWorkspace ? "/student/notifications" : "/admin/settings",
                );
              } else {
                router.push(isStudentWorkspace ? "/student/profile" : "/admin/settings");
              }
            },
          }))}
          leadingAction={
            <Button
              aria-label="Open navigation"
              background="#FFFFFF"
              borderColor="#E1E7F0"
              borderWidth={1}
              height={44}
              onPress={() => setIsMobileNavOpen(true)}
              rounded="$4"
              width={44}
            >
              <Menu aria-hidden="true" color="#0F1D3A" size={20} />
            </Button>
          }
          onSearchSubmit={(value) => {
            const search = value.trim();
            router.push(
              search
                ? `${routePrefix}/${isStudentWorkspace ? "resources" : "organizations"}?search=${encodeURIComponent(search)}`
                : `${routePrefix}/${isStudentWorkspace ? "resources" : "organizations"}`,
            );
          }}
          organizationIcon={<Building2 color="#52627A" size={20} strokeWidth={2} />}
          organizationLabel={
            isStudentWorkspace
              ? undefined
              : organizationQuery.data?.name ??
                (currentUser?.organizationId ? "Organization" : "All organizations")
          }
          organizationOnPress={() =>
            router.push(isStudentWorkspace ? "/student/profile" : "/admin/organizations")
          }
          profile={{ name: studentProfile?.name ?? profileName, role: profileRole }}
          profileActions={[
            {
              icon: <UserRound aria-hidden="true" color="#435266" size={15} />,
              id: "profile",
              label: "Profile",
              onPress: () =>
                router.push(isStudentWorkspace ? "/student/profile" : "/admin/settings"),
            },
            {
              closeOnPress: false,
              destructive: true,
              disabled: logoutMutation.isPending,
              icon: (
                <LogOut
                  aria-hidden="true"
                  color="#DC2626"
                  size={15}
                  strokeWidth={2.1}
                />
              ),
              id: "logout",
              label: logoutMutation.isPending ? "Logging out" : "Logout",
              loading: logoutMutation.isPending,
              onPress: handleLogout,
            },
          ]}
          profileOnPress={() =>
            router.push(isStudentWorkspace ? "/student/profile" : "/admin/settings")
          }
          searchPlaceholder={
            isStudentWorkspace
              ? "Search for courses, resources, or anything..."
              : "Search organizations, courses, resources, users..."
          }
          shortcutLabel="⌘ K"
        />

        <ScrollView className="lms-workspace-scroll" flex={1}>
          <YStack
            className="lms-workspace-content"
            p="$5"
            style={{ backgroundColor: "#FCFDFD", minHeight: "100%" }}
          >
            {children}
          </YStack>
        </ScrollView>
      </YStack>
    </XStack>
  );
};

export default WorkspaceLayout;
