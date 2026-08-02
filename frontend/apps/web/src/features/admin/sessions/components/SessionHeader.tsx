import { Plus, RefreshCw } from "lucide-react";
import { Text, XStack, YStack } from "@repo/ui";
import { OrganizationHeaderAction } from "../../organizations/components/header/OrganizationHeaderAction";

export function SessionHeader({
  canCreate,
  hasOrganization,
  isFetching,
  onAdd,
  onRefresh,
}: {
  canCreate: boolean;
  hasOrganization: boolean;
  isFetching: boolean;
  onAdd: () => void;
  onRefresh: () => void;
}) {
  return (
    <XStack className="lms-organizations-header" gap="$4" style={{ alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
      <YStack gap="$2" style={{ maxWidth: 720, minWidth: 0 }}>
        <XStack gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <Text color="#0F1D3A" fontSize={30} fontWeight="$heading">Sessions</Text>
          <XStack px="$3" py="$1" rounded="$6" style={{ alignItems: "center", backgroundColor: isFetching ? "#EFF6FF" : "#DDF4E7", borderColor: isFetching ? "#BFDBFE" : "#B7E4CB", borderWidth: 1 }}>
            <Text color={isFetching ? "#2563EB" : "#047857"} fontSize={11} fontWeight="$button">{isFetching ? "Syncing" : "Synced"}</Text>
          </XStack>
        </XStack>
        <Text color="#52627A" fontSize="$label" lineHeight="$label">
          Manage organization academic sessions, schedules, statuses, and lifecycle from one role-aware workspace.
        </Text>
      </YStack>
      <XStack className="lms-organizations-actions" gap="$3" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <OrganizationHeaderAction icon={<RefreshCw aria-hidden="true" size={16} />} onPress={onRefresh}>Refresh</OrganizationHeaderAction>
        {canCreate && hasOrganization ? <OrganizationHeaderAction icon={<Plus aria-hidden="true" color="#FFFFFF" size={16} />} onPress={onAdd} primary>Add Session</OrganizationHeaderAction> : null}
      </XStack>
    </XStack>
  );
}
