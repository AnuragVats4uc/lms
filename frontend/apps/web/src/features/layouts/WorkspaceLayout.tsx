"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, CalendarDays, CircleHelp, Menu } from "lucide-react";
import { Button, DashboardHeader, ScrollView, XStack, YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";
import { organizationsApi } from "@repo/api";

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
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.permission || userHasPermission(currentUser, item.permission),
  );
  const organizationQuery = useQuery({
    enabled: currentUser?.organizationId != null,
    queryFn: () => organizationsApi.findOne(currentUser?.organizationId as number),
    queryKey: ["workspace-organization", currentUser?.organizationId],
    staleTime: 60_000,
  });
  const profileName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName ?? ""}`.trim()
    : "User";
  const profileRole = currentUser?.role ?? currentUser?.roles?.[0] ?? "Admin";
  const headerActions = [
    {
      icon: <CalendarDays color="#059669" size={20} strokeWidth={2.1} />,
      label: "Open calendar",
    },
    {
      icon: <Bell color="#0F1D3A" size={20} strokeWidth={2.1} />,
      label: "View notifications",
      notificationCount: 0,
    },
    {
      icon: <CircleHelp color="#0F1D3A" size={20} strokeWidth={2.1} />,
      label: "Open help",
    },
  ];

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
              if (action.label === "Open calendar") router.push("/admin/sessions");
              else router.push("/admin/settings");
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
                ? `/admin/organizations?search=${encodeURIComponent(search)}`
                : "/admin/organizations",
            );
          }}
          organizationIcon={<Building2 color="#52627A" size={20} strokeWidth={2} />}
          organizationLabel={
            organizationQuery.data?.name ??
            (currentUser?.organizationId ? "Organization" : "All organizations")
          }
          organizationOnPress={() => router.push("/admin/organizations")}
          profile={{ name: profileName, role: profileRole }}
          profileOnPress={() => router.push("/admin/settings")}
          searchPlaceholder="Search organizations, courses, resources, users..."
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
