"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import {
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
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.permission ||
      userHasPermission(currentUser, item.permission)
  );

  return (
    <XStack
      style={{
        backgroundColor: "#FCFDFD",
        minHeight: "100vh",
      }}
    >
      <YStack
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
        <Link href={`/${title.toLowerCase()}/dashboard`}>
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
              <Link href={item.href} key={item.href}>
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
      </YStack>

      <YStack
        flex={1}
        style={{ backgroundColor: "#FCFDFD", minWidth: 0 }}
      >
        <DashboardHeader {...dashboardHeader} />

        <ScrollView flex={1}>
          <YStack p="$5" style={{ backgroundColor: "#FCFDFD" }}>
            {children}
          </YStack>
        </ScrollView>
      </YStack>
    </XStack>
  );
};

export default WorkspaceLayout;
