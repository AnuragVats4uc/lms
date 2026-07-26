"use client";

import { memo } from "react";
import { YStack } from "tamagui";

import { RoleCard } from "../RoleCard";
import type { RoleGridProps } from "./types";

export const RoleGrid = memo(function RoleGrid({
  roles,
}: RoleGridProps) {
  return (
    <YStack
      className="lms-dashboard-role-grid"
      gap="$3"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        minWidth: 0,
      }}
    >
      {roles.map((role) => (
        <RoleCard key={role.role} minW={0} {...role} />
      ))}
    </YStack>
  );
});
