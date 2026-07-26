"use client";

import { memo } from "react";
import { YStack } from "tamagui";

import { AppCard } from "../../primitives";
import { SectionTitle } from "../SectionTitle";
import type { DashboardSectionProps } from "./types";

export const DashboardSection = memo(function DashboardSection({
  action,
  children,
  description,
  title,
}: DashboardSectionProps) {
  return (
    <AppCard
      background="#FFFFFF"
      borderColor="#E1E7F0"
      p="$4"
      style={{
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
      }}
    >
      <YStack gap="$4">
        <SectionTitle
          action={action}
          description={description}
          title={title}
        />
        {children}
      </YStack>
    </AppCard>
  );
});
