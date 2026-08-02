"use client";

import { XStack } from "@repo/ui";

import { OrganizationStatCard } from "../../organizations/components/stats/OrganizationStatCard";
import type { CrudStat } from "./types";

export interface CrudStatsProps {
  isLoading: boolean;
  stats: CrudStat[];
}

export const CrudStats = ({ isLoading, stats }: CrudStatsProps) => (
  <XStack className="lms-organization-stats-grid" gap="$3">
    {stats.map((stat) => (
      <OrganizationStatCard
        icon={stat.icon}
        isLoading={isLoading}
        key={stat.label}
        label={stat.label}
        value={stat.value}
      />
    ))}
  </XStack>
);
