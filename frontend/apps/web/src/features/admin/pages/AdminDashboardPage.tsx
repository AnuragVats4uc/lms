"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, Text, XStack, YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import { userHasPermission } from "@/features/shared/access";
import { adminNavigation } from "@/features/layouts/navigation";

export function AdminDashboardPage() {
  const { currentUser } = useAuthSession();
  const visibleModules = adminNavigation.filter(
    (item) =>
      item.href !== "/admin/dashboard" &&
      (!item.permission ||
        userHasPermission(currentUser, item.permission))
  );

  return (
    <YStack gap="$4">
      <YStack>
        <Text
          color="#172033"
          fontSize={28}
          fontWeight="700"
        >
          Admin Dashboard
        </Text>
        <Text color="#647084" fontSize={14}>
          Manage organizations, users, RBAC, and future LMS
          modules from one workspace.
        </Text>
      </YStack>

      <XStack flexWrap="wrap" gap="$3">
        {visibleModules.map((module) => {
          const Icon = module.icon;

          return (
            <Link href={module.href} key={module.href}>
              <Card
                width={260}
                minHeight={150}
                borderColor="#DFE6EE"
                borderRadius={8}
                borderWidth={1}
                backgroundColor="#FFFFFF"
                padding="$4"
                hoverStyle={{ borderColor: "#0A7A5F" }}
              >
                <YStack gap="$3">
                  <XStack
                    style={{
                      alignItems: "center",
                      backgroundColor: "#E7F5F1",
                      borderRadius: 8,
                      height: 42,
                      justifyContent: "center",
                      width: 42,
                    }}
                  >
                    <Icon
                      aria-hidden="true"
                      size={21}
                      strokeWidth={2.2}
                      color="#0A7A5F"
                    />
                  </XStack>
                  <Text
                    color="#172033"
                    fontSize={17}
                    fontWeight="700"
                  >
                    {module.label}
                  </Text>
                  <XStack
                    gap="$2"
                    style={{ alignItems: "center" }}
                  >
                    <Text color="#0A7A5F" fontSize={14}>
                      Open
                    </Text>
                    <ArrowRight
                      aria-hidden="true"
                      size={15}
                      strokeWidth={2.5}
                      color="#0A7A5F"
                    />
                  </XStack>
                </YStack>
              </Card>
            </Link>
          );
        })}
      </XStack>
    </YStack>
  );
}
