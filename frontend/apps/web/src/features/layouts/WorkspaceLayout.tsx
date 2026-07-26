"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import {
  Button,
  DashboardHeader,
  ScrollView,
  Text,
  XStack,
  YStack,
} from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import { userHasPermission } from "@/features/shared/access";
import type { NavigationItem } from "./navigation";
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
      !item.permission ||
      userHasPermission(currentUser, item.permission)
  );

  const renderSidebarContent = (onNavigate?: () => void) => (
    <>
      <Link href={`/${title.toLowerCase()}/dashboard`} onClick={onNavigate}>
        <XStack gap="$3" style={{ alignItems: "center" }}>
          <GraduationCap
            aria-hidden="true"
            size={28}
            strokeWidth={2.5}
            color="#0A7A5F"
          />
          <Text
            color="#0A7A5F"
            fontSize={21}
            fontWeight="700"
          >
            LMS {title}
          </Text>
        </XStack>
      </Link>

      <YStack gap="$2">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link href={item.href} key={item.href} onClick={onNavigate}>
              <XStack
                gap="$3"
                px="$3"
                hoverStyle={{
                  background: "#EAF7F3",
                }}
                style={{
                  alignItems: "center",
                  borderRadius: 8,
                  minHeight: 42,
                }}
              >
                <Icon
                  aria-hidden="true"
                  size={18}
                  strokeWidth={2.2}
                  color="#435266"
                />
                <Text color="#334155" fontSize={14}>
                  {item.label}
                </Text>
              </XStack>
            </Link>
          );
        })}
      </YStack>
    </>
  );

  return (
    <XStack
      className="lms-workspace-shell"
      style={{
        backgroundColor: "#FCFDFD",
        minHeight: "100vh",
      }}
    >
      <YStack
        className="lms-workspace-sidebar"
        gap="$5"
        p="$4"
        style={{
          alignSelf: "flex-start",
          backgroundColor: "#FEFEFE",
          borderRightColor: "#DFE6EE",
          borderRightWidth: 1,
          flexShrink: 0,
          height: "100vh",
          overflowY: "auto",
          position: "sticky",
          top: 0,
          width: 268,
        }}
      >
        {renderSidebarContent()}
      </YStack>

      {isMobileNavOpen ? (
        <XStack
          className="lms-mobile-nav-overlay"
          onPress={() => setIsMobileNavOpen(false)}
        />
      ) : null}

      {isMobileNavOpen ? (
        <YStack
          className="lms-mobile-nav-drawer is-open"
          gap="$5"
          p="$4"
          style={{
            backgroundColor: "#FEFEFE",
            borderRightColor: "#DFE6EE",
            borderRightWidth: 1,
            height: "100vh",
            left: 0,
            overflowY: "auto",
            position: "fixed",
            top: 0,
            width: 268,
            zIndex: 50,
          }}
        >
          <XStack style={{ justifyContent: "flex-end" }}>
            <Button
              aria-label="Close navigation"
              background="#FFFFFF"
              borderColor="#E1E7F0"
              borderWidth={1}
              height={44}
              onPress={() => setIsMobileNavOpen(false)}
              rounded="$4"
              width={44}
            >
              <X aria-hidden="true" color="#0F1D3A" size={18} />
            </Button>
          </XStack>
          {renderSidebarContent(() => setIsMobileNavOpen(false))}
        </YStack>
      ) : null}

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
