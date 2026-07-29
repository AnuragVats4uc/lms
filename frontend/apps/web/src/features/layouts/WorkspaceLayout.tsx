"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button, DashboardHeader, ScrollView, XStack, YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import { userHasPermission } from "@/features/shared/access";
import type { NavigationItem } from "./navigation";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { dashboardHeader } from "@/mocks/dashboard";

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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.permission || userHasPermission(currentUser, item.permission),
  );

  return (
    <XStack
      className="lms-workspace-shell"
      style={{
        backgroundColor: "#FCFDFD",
        minHeight: "100vh",
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
        style={{ backgroundColor: "#FCFDFD", minWidth: 0 }}
      >
        <DashboardHeader
          {...dashboardHeader}
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
        />

        <ScrollView className="lms-workspace-scroll" flex={1}>
          <YStack
            className="lms-workspace-content"
            p="$5"
            style={{ backgroundColor: "#FCFDFD" }}
          >
            {children}
          </YStack>
        </ScrollView>
      </YStack>
    </XStack>
  );
};

export default WorkspaceLayout;
