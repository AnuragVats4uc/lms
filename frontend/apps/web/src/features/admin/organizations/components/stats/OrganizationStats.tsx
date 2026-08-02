"use client";

import { useMemo } from "react";
import { Activity, Building2, CheckCircle2, XCircle } from "lucide-react";
import { XStack } from "@repo/ui";

import type { OrganizationStat } from "../../types";
import { OrganizationStatCard } from "./OrganizationStatCard";

interface OrganizationStatsProps {
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  newlyCreatedCount: number;
  total: number;
}

export const OrganizationStats = ({
  activeCount,
  inactiveCount,
  isLoading,
  newlyCreatedCount,
  total,
}: OrganizationStatsProps) => {
  const stats = useMemo<OrganizationStat[]>(
    () => [
      {
        icon: <Building2 aria-hidden="true" color="#059669" size={20} />,
        label: "Total Organizations",
        value: total,
      },
      {
        icon: <CheckCircle2 aria-hidden="true" color="#059669" size={20} />,
        label: "Active Organizations",
        value: activeCount,
      },
      {
        icon: <XCircle aria-hidden="true" color="#DC2626" size={20} />,
        label: "Inactive Organizations",
        value: inactiveCount,
      },
      {
        icon: <Activity aria-hidden="true" color="#2563EB" size={20} />,
        label: "Newly Created (Last 30 Days)",
        value: newlyCreatedCount,
      },
    ],
    [activeCount, inactiveCount, newlyCreatedCount, total],
  );

  return (
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
};
