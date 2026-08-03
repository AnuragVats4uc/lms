"use client";

import type { ReactNode } from "react";
import { Text, XStack, YStack } from "@repo/ui";

export interface CrudDetailFieldProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export const CrudDetailField = ({
  icon,
  label,
  value,
}: CrudDetailFieldProps) => (
  <XStack gap="$2" style={{ alignItems: "flex-start", minWidth: 0 }}>
    <XStack
      background="#EAF7F3"
      height={30}
      justify="center"
      rounded="$3"
      width={30}
      style={{ alignItems: "center", flexShrink: 0 }}
    >
      {icon}
    </XStack>
    <YStack gap="$1" minW={0} style={{ flex: 1 }}>
      <Text color="#7A879B" fontSize={10} fontWeight="$button">
        {label}
      </Text>
      <Text color="#0F1D3A" fontSize="$caption" numberOfLines={3}>
        {value || "-"}
      </Text>
    </YStack>
  </XStack>
);

export interface CrudDetailSectionProps {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}

export const CrudDetailSection = ({
  children,
  icon,
  title,
}: CrudDetailSectionProps) => (
  <YStack
    gap="$3"
    p="$3"
    background="#F8FBFD"
    borderColor="#E6EDF3"
    borderWidth={1}
    rounded="$4"
  >
    <XStack gap="$2" style={{ alignItems: "center" }}>
      {icon}
      <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
        {title}
      </Text>
    </XStack>
    <YStack gap="$3">{children}</YStack>
  </YStack>
);
