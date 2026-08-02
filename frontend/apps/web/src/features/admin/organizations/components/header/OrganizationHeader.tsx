"use client";

import { Plus, RefreshCw } from "lucide-react";
import { Text, XStack, YStack } from "@repo/ui";

import { OrganizationHeaderAction } from "./OrganizationHeaderAction";

interface OrganizationHeaderProps {
  isFetching: boolean;
  onAdd: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

export const OrganizationHeader = ({
  isFetching,
  onAdd,
  onRefresh,
}: OrganizationHeaderProps) => {
  return (
    <XStack
      className="lms-organizations-header"
      width="100%"
      gap="$4"
      justify="space-between"
      minW={0}
    >
      <YStack gap="$2" minW={0} maxW={720}>
        <XStack className="items-center" gap="$3" flexWrap="wrap">
          <Text color="#0F1D3A" fontSize={30} fontWeight="$heading">
            Organizations
          </Text>
          <XStack
            className="items-center"
            px="$3"
            py="$1"
            rounded="$6"
            background={isFetching ? "#EFF6FF" : "#DDF4E7"}
            borderWidth={1}
            borderColor={isFetching ? "#BFDBFE" : "#B7E4CB"}
            style={{
              transition:
                "background-color 180ms ease, border-color 180ms ease",
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
          Manage tenant organizations, administrators, access readiness, and LMS
          tenancy configuration from one role-aware workspace.
        </Text>
      </YStack>

      <XStack
        className="lms-organizations-actions"
        gap="$3"
        maxW="100%"
        minW={0}
        justify="flex-end"
        flexWrap="wrap"
      >
        <OrganizationHeaderAction
          icon={<RefreshCw aria-hidden="true" size={16} />}
          onPress={onRefresh}
        >
          Refresh
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
};
