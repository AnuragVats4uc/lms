"use client";

import { Download, Plus, RefreshCw } from "lucide-react";
import { Text, XStack, YStack } from "@repo/ui";

import { OrganizationHeaderAction } from "./OrganizationHeaderAction";

interface OrganizationHeaderProps {
  isFetching: boolean;
  onAdd: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

export function OrganizationHeader({
  isFetching,
  onAdd,
  onExport,
  onRefresh,
}: OrganizationHeaderProps) {
  return (
    <XStack
      className="lms-organizations-header"
      gap="$4"
      style={{
        alignItems: "flex-start",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <YStack gap="$2" style={{ maxWidth: 720, minWidth: 0 }}>
        <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <Text color="#0F1D3A" fontSize={30} fontWeight="$heading">
            Organizations
          </Text>
          <XStack
            px="$3"
            py="$1"
            rounded="$6"
            style={{
              alignItems: "center",
              backgroundColor: isFetching ? "#EFF6FF" : "#DDF4E7",
              borderColor: isFetching ? "#BFDBFE" : "#B7E4CB",
              borderWidth: 1,
              transition: "background-color 180ms ease, border-color 180ms ease",
            }}
          >
            <Text
              color={isFetching ? "#2563EB" : "#047857"}
              fontSize={11}
              fontWeight="$button"
            >
              {isFetching ? "Syncing" : "Synced"}
            </Text>
          </XStack>
        </XStack>
        <Text color="#52627A" fontSize="$label" lineHeight="$label">
          Manage tenant organizations, administrators, access readiness, and
          LMS tenancy configuration from one role-aware workspace.
        </Text>
      </YStack>

      <XStack
        className="lms-organizations-actions"
        gap="$3"
        style={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <OrganizationHeaderAction
          icon={<RefreshCw aria-hidden="true" size={16} />}
          onPress={onRefresh}
        >
          Refresh
        </OrganizationHeaderAction>
        <OrganizationHeaderAction
          icon={<Download aria-hidden="true" size={16} />}
          onPress={onExport}
        >
          Export
        </OrganizationHeaderAction>
        <OrganizationHeaderAction
          icon={<Plus aria-hidden="true" color="#FFFFFF" size={16} />}
          onPress={onAdd}
          primary
        >
          Add Organization
        </OrganizationHeaderAction>
      </XStack>
    </XStack>
  );
}
