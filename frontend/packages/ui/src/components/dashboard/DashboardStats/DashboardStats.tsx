"use client";

import { memo } from "react";
import { YStack, styled } from "tamagui";

import { QuickActionsCard } from "../QuickActions";
import { StatCard } from "../StatCard";
import type { DashboardStatsProps } from "./types";

const StatsGrid = styled(YStack, {
  gap: "$3",
  width: "100%",
});

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 0.92fr) minmax(0, 0.92fr) minmax(360px, 1.42fr)",
} as const;

export const DashboardStats = memo(function DashboardStats({
  quickActions,
  stats,
}: DashboardStatsProps) {
  return (
    <StatsGrid className="lms-dashboard-stats-grid" style={gridStyle}>
      {stats.map((stat) => (
        <StatCard key={stat.title} minW={0} {...stat} />
      ))}
      <QuickActionsCard minW={0} {...quickActions} />
    </StatsGrid>
  );
});
