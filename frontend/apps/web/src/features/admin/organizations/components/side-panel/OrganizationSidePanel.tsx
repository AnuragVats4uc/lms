import { Button, Text, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";

import type { OrganizationTableRow } from "../../types";
import { formatDate } from "../../utils";
import { PanelCount } from "./PanelCount";
import { PanelMetric } from "./PanelMetric";

export interface OrganizationSidePanelProps {
  isLoading: boolean;
  organization: OrganizationTableRow | null;
}

export function OrganizationSidePanel({
  isLoading,
  organization,
}: OrganizationSidePanelProps) {
  if (!organization && !isLoading) {
    return null;
  }

  return (
    <AppCard
      className="lms-organization-side-panel"
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      style={{
        borderRadius: 16,
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.045)",
        minWidth: 300,
      }}
    >
      {isLoading || !organization ? (
        <YStack gap="$3">
          <XStack className="lms-skeleton" style={{ height: 56, width: 56 }} />
          <XStack className="lms-skeleton" style={{ height: 18, width: 180 }} />
          <XStack
            className="lms-skeleton"
            style={{ height: 120, width: "100%" }}
          />
        </YStack>
      ) : (
        <YStack gap="$4">
          <XStack gap="$3" style={{ alignItems: "center" }}>
            <XStack
              style={{
                alignItems: "center",
                backgroundColor: "#DDF4E7",
                borderRadius: 999,
                height: 58,
                justifyContent: "center",
                width: 58,
              }}
            >
              <Text color="#047857" fontSize={22} fontWeight="$heading">
                {organization.name.slice(0, 1)}
              </Text>
            </XStack>
            <YStack style={{ minWidth: 0 }}>
              <Text
                color="#0F1D3A"
                fontSize="$label"
                fontWeight="$heading"
                numberOfLines={1}
              >
                {organization.name}
              </Text>
              <Text color="#52627A" fontSize="$caption" numberOfLines={1}>
                {organization.code}
              </Text>
            </YStack>
          </XStack>

          <XStack gap="$2" style={{ flexWrap: "wrap" }}>
            <Text
              color={organization.isActive ? "#047857" : "#64748B"}
              fontSize="$caption"
              fontWeight="$button"
              px="$2"
              py="$1"
              rounded="$3"
              style={{
                backgroundColor: organization.isActive ? "#DDF4E7" : "#F1F5F9",
              }}
            >
              {organization.isActive ? "Active" : "Inactive"}
            </Text>
            <Text
              color="#047857"
              fontSize="$caption"
              fontWeight="$button"
              px="$2"
              py="$1"
              rounded="$3"
              style={{ backgroundColor: "#DDF4E7" }}
            >
              Synced
            </Text>
          </XStack>

          <YStack gap="$2">
            <PanelMetric label="Website" value={organization.domain ?? "-"} />
            <PanelMetric
              label="Administrator"
              value={organization.primaryAdministrator?.name ?? "Not assigned"}
            />
            <PanelMetric
              label="Created"
              value={formatDate(organization.createdAt)}
            />
            <PanelMetric
              label="Updated"
              value={formatDate(organization.updatedAt)}
            />
          </YStack>

          <XStack gap="$2" style={{ flexWrap: "wrap" }}>
            <PanelCount label="Users" value={organization.metrics.users} />
            <PanelCount
              label="Students"
              value={organization.metrics.students}
            />
            <PanelCount label="Courses" value={organization.metrics.courses} />
            <PanelCount
              label="Resources"
              value={organization.metrics.resources}
            />
          </XStack>

          <YStack gap="$2">
            <XStack style={{ justifyContent: "space-between" }}>
              <Text color="#52627A" fontSize="$caption">
                Storage Usage
              </Text>
              <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
                {organization.metrics.storageUsedGb} GB /{" "}
                {organization.metrics.storageLimitGb || 0} GB
              </Text>
            </XStack>
            <XStack
              style={{
                backgroundColor: "#E8EEF6",
                borderRadius: 999,
                height: 6,
                overflow: "hidden",
              }}
            >
              <XStack
                style={{
                  backgroundColor: "#059669",
                  width: "0%",
                }}
              />
            </XStack>
          </YStack>

          <YStack
            gap="$2"
            p="$3"
            style={{
              backgroundColor: "#F8FBFD",
              borderColor: "#D8E1EC",
              borderRadius: 12,
              borderWidth: 1,
            }}
          >
            <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
              Quick Health Summary
            </Text>
            <Text color="#52627A" fontSize="$caption">
              Contact data is {organization.email ? "available" : "incomplete"}.
              Courses and students will appear when those modules are connected.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
              Recent Activity
            </Text>
            <Text color="#52627A" fontSize="$caption">
              Updated on {formatDate(organization.updatedAt)}
            </Text>
          </YStack>

          <Button
            background="#FFFFFF"
            borderColor="#D8E1EC"
            borderWidth={1}
            height={40}
            rounded="$4"
          >
            <Button.Text
              color="#047857"
              fontSize="$caption"
              fontWeight="$button"
            >
              View Organization Details
            </Button.Text>
          </Button>
        </YStack>
      )}
    </AppCard>
  );
}
