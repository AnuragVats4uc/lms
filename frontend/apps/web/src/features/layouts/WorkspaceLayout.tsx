"use client";

import Link from "next/link";
import {
  GraduationCap,
  LogOut,
  UserRound,
} from "lucide-react";
import {
  Button,
  ScrollView,
  Text,
  XStack,
  YStack,
} from "@repo/ui";
import { useAuthSession, useLogout } from "@repo/auth";

import {
  getUserDisplayName,
  userHasPermission,
} from "@/features/shared/access";
import type { NavigationItem } from "./navigation";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  title: string;
}

export function WorkspaceLayout({
  children,
  navigation,
  title,
}: WorkspaceLayoutProps) {
  const { currentUser } = useAuthSession();
  const logout = useLogout();
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.permission ||
      userHasPermission(currentUser, item.permission)
  );
  const userName =
    getUserDisplayName(currentUser) || "LMS User";
  const roleLabel =
    currentUser?.roles?.[0]?.replace(/_/g, " ") ?? title;

  return (
    <XStack
      style={{
        backgroundColor: "#F6F8FB",
        minHeight: "100vh",
      }}
    >
      <YStack
        gap="$5"
        p="$4"
        style={{
          backgroundColor: "#FFFFFF",
          borderRightColor: "#DFE6EE",
          borderRightWidth: 1,
          flexShrink: 0,
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

      <YStack flex={1} style={{ minWidth: 0 }}>
        <XStack
          gap="$4"
          px="$5"
          style={{
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderBottomColor: "#DFE6EE",
            borderBottomWidth: 1,
            justifyContent: "space-between",
            minHeight: 82,
          }}
        >
          <YStack>
            <Text
              color="#172033"
              fontSize={24}
              fontWeight="700"
            >
              {title}
            </Text>
            <Text color="#647084" fontSize={13}>
              Multi-tenant LMS workspace
            </Text>
          </YStack>

          <XStack gap="$3" style={{ alignItems: "center" }}>
            <XStack
              gap="$3"
              p="$2.5"
              style={{
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderColor: "#DFE6EE",
                borderRadius: 8,
                borderWidth: 1,
              }}
            >
              <XStack
                style={{
                  alignItems: "center",
                  backgroundColor: "#E7F5F1",
                  borderRadius: 8,
                  height: 34,
                  justifyContent: "center",
                  width: 34,
                }}
              >
                <UserRound
                  aria-hidden="true"
                  size={18}
                  strokeWidth={2}
                  color="#0A7A5F"
                />
              </XStack>
              <YStack style={{ maxWidth: 180 }}>
                <Text
                  color="#172033"
                  fontSize={14}
                  fontWeight="700"
                  numberOfLines={1}
                >
                  {userName}
                </Text>
                <Text
                  color="#647084"
                  fontSize={12}
                  numberOfLines={1}
                >
                  {roleLabel}
                </Text>
              </YStack>
            </XStack>

            <Button
              onPress={() => logout.mutate()}
              aria-label="Log out"
              style={{
                borderRadius: 8,
                height: 42,
                width: 42,
              }}
            >
              <LogOut
                aria-hidden="true"
                size={18}
                strokeWidth={2.2}
              />
            </Button>
          </XStack>
        </XStack>

        <ScrollView flex={1}>
          <YStack p="$5">{children}</YStack>
        </ScrollView>
      </YStack>
    </XStack>
  );
}
