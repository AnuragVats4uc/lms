"use client";

import { memo } from "react";

import { AppCard } from "../../primitives";
import type { DashboardCardProps } from "./types";

export const DashboardCard = memo(function DashboardCard(
  props: DashboardCardProps
) {
  return <AppCard {...props} />;
});
