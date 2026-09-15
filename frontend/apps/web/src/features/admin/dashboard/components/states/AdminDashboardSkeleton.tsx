import { AppCard } from "@repo/ui/primitives";
import { PageContainer } from "@repo/ui/dashboard";
import { XStack, YStack } from "@repo/ui";

import { DashboardSkeletonBlock } from "./DashboardSkeletonBlock";

export const AdminDashboardSkeleton = ({
  statCount,
}: {
  statCount: number;
}) => (
  <PageContainer>
    <YStack gap="$4">
      <YStack
        className="lms-dashboard-stats-grid"
        gap="$3"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${statCount}, minmax(160px, 1fr)) minmax(260px, 0.9fr)`,
          width: "100%",
        }}
      >
        {Array.from({ length: statCount }).map((_, index) => (
          <AppCard
            key={index}
            background="#FFFFFF"
            borderColor="#E1E7F0"
            p="$4"
            style={{ borderRadius: 12, minHeight: 136, minWidth: 0 }}
          >
            <XStack gap="$3" style={{ alignItems: "center" }}>
              <DashboardSkeletonBlock height={52} rounded={14} width={52} />
              <YStack gap="$2" style={{ flex: 1 }}>
                <DashboardSkeletonBlock height={12} width="56%" />
                <DashboardSkeletonBlock height={28} width="38%" />
                <DashboardSkeletonBlock height={12} width="78%" />
              </YStack>
            </XStack>
          </AppCard>
        ))}
        <DashboardSkeletonBlock height={136} rounded={12} />
      </YStack>
      <DashboardSkeletonBlock height={540} rounded={12} />
      <DashboardSkeletonBlock height={130} rounded={12} />
    </YStack>
  </PageContainer>
);
