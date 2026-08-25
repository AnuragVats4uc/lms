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

export const DashboardStats = memo(function DashboardStats({
  quickActions,
  stats,
}: DashboardStatsProps) {
  return (
    <StatsGrid
      className="lms-dashboard-stats-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stats.length}, minmax(160px, 1fr)) minmax(260px, 0.9fr)`,
      }}
    >
      {stats.map((stat) => (
        <StatCard key={stat.title} minW={0} {...stat} />
      ))}
      <QuickActionsCard minW={0} {...quickActions} />
    </StatsGrid>
  );
});
