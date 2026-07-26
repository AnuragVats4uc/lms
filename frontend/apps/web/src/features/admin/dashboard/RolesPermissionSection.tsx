"use client";

import { ArrowRight } from "lucide-react";
import { AppCard } from "@repo/ui/primitives";
import { RoleGrid } from "@repo/ui/dashboard";
import { Text, XStack, YStack } from "@repo/ui";
import type { RoleCardProps } from "@repo/ui/dashboard";

interface RolesPermissionSectionProps {
  roles: RoleCardProps[];
}

export function RolesPermissionSection({
  roles,
}: RolesPermissionSectionProps) {
  return (
    <AppCard
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      style={{
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
      }}
    >
      <YStack gap="$3">
        <XStack
          style={{
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <XStack gap="$5" style={{ alignItems: "baseline", minWidth: 0 }}>
            <Text
              color="#0F1D3A"
              fontSize={16}
              fontWeight="$heading"
              lineHeight={20}
            >
              Roles & Permissions
            </Text>
            <Text color="#52627A" fontSize={10} lineHeight={12}>
              Manage roles and their access permissions.
            </Text>
          </XStack>
          <XStack gap="$2" style={{ alignItems: "center", flexShrink: 0 }}>
            <Text
              color="#047857"
              fontSize="$caption"
              fontWeight="$button"
              lineHeight="$caption"
            >
              View All Roles
            </Text>
            <ArrowRight aria-hidden="true" color="#047857" size={14} />
          </XStack>
        </XStack>
        <RoleGrid roles={roles} />
      </YStack>
    </AppCard>
  );
}
