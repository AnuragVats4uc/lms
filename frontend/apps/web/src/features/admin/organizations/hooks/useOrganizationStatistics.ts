"use client";

import { useMemo } from "react";

import type { OrganizationTableRow } from "../types";
import { isWithinCreatedDate } from "../utils";

export function useOrganizationStatistics(
  rows: OrganizationTableRow[],
  total: number,
) {
  return useMemo(
    () => ({
      activeCount: rows.filter(
        (row) => row.status === "ACTIVE" && row.isActive,
      ).length,
      inactiveCount: rows.filter(
        (row) => row.status === "INACTIVE" || !row.isActive,
      ).length,
      newlyCreatedCount: rows.filter((row) =>
        isWithinCreatedDate(row.createdAt, "30d"),
      ).length,
      total,
    }),
    [rows, total],
  );
}
