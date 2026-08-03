"use client";

import { Plus, RefreshCw } from "lucide-react";
import { Text, XStack, YStack } from "@repo/ui";

import { CrudHeaderAction } from "./CrudHeaderAction";

export interface CrudPageHeaderProps {
  canCreate: boolean;
  createLabel: string;
  description: string;
  isFetching: boolean;
  onCreate: () => void;
  onRefresh: () => void;
  title: string;
}

export const CrudPageHeader = ({
  canCreate,
  createLabel,
  description,
  isFetching,
  onCreate,
  onRefresh,
  title,
}: CrudPageHeaderProps) => (
  <XStack
    className="lms-organizations-header"
    gap="$4"
    justify="space-between"
    minW={0}
    width="100%"
  >
    <YStack gap="$2" maxW={720} minW={0}>
      <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <Text color="#0F1D3A" fontSize={30} fontWeight="$heading">
          {title}
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
        {description}
      </Text>
    </YStack>

    <XStack
      className="lms-organizations-actions"
      gap="$3"
      justify="flex-end"
      maxW="100%"
      minW={0}
      style={{ alignItems: "center", flexWrap: "wrap" }}
    >
      <CrudHeaderAction
        icon={<RefreshCw aria-hidden="true" size={16} />}
        onPress={onRefresh}
      >
        Refresh
      </CrudHeaderAction>
      {canCreate ? (
        <CrudHeaderAction
          icon={<Plus aria-hidden="true" color="#FFFFFF" size={16} />}
          onPress={onCreate}
          primary
        >
          {createLabel}
        </CrudHeaderAction>
      ) : null}
    </XStack>
  </XStack>
);
