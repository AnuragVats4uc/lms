"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { AppCard, AppEmptyState } from "@repo/ui/primitives";
import { RoleGrid } from "@repo/ui/dashboard";
import { Button, Text, XStack, YStack } from "@repo/ui";
import type { RoleCardProps } from "@repo/ui/dashboard";

interface RolesPermissionSectionProps {
  onViewAllRoles?: () => void;
  roles: RoleCardProps[];
}

export function RolesPermissionSection({
  onViewAllRoles,
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
          <Button
            aria-label="View all roles"
            background="transparent"
            chromeless
            disabled={!onViewAllRoles}
            height={28}
            onPress={onViewAllRoles}
            px={0}
            rounded="$2"
            style={{ alignItems: "center", flexShrink: 0 }}
          >
            <Text
              color="#047857"
              fontSize="$caption"
              fontWeight="$button"
              lineHeight="$caption"
            >
              View All Roles
            </Text>
            <ArrowRight aria-hidden="true" color="#047857" size={14} />
          </Button>
        </XStack>
        {roles.length ? (
          <RoleGrid roles={roles} />
        ) : (
          <AppEmptyState
            action={
              <Button
                aria-label="Open roles"
                background="#FFFFFF"
                borderColor="#10B981"
                borderWidth={1}
                disabled={!onViewAllRoles}
                height={38}
                onPress={onViewAllRoles}
                px="$4"
                rounded="$3"
              >
                <Button.Text
                  color="#047857"
                  fontSize="$caption"
                  fontWeight="$button"
                >
                  Open Roles
                </Button.Text>
                <ArrowRight aria-hidden="true" color="#047857" size={14} />
              </Button>
            }
            description="Create organization roles and assign permissions to control access across the admin workspace."
            icon={
              <XStack
                background="#ECFDF5"
                height={52}
                rounded="$10"
                style={{
                  alignItems: "center",
                  color: "#059669",
                  justifyContent: "center",
                }}
                width={52}
              >
                <ShieldCheck aria-hidden="true" size={26} strokeWidth={2.1} />
              </XStack>
            }
            title="No roles yet"
          />
        )}
      </YStack>
    </AppCard>
  );
}
