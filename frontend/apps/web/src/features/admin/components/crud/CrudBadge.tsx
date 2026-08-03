"use client";

import type { ReactNode } from "react";
import { Text, XStack } from "@repo/ui";

export type CrudBadgeTone =
  "success" | "danger" | "warning" | "info" | "neutral";

const toneStyles: Record<
  CrudBadgeTone,
  { background: string; color: string; border: string }
> = {
  danger: { background: "#FEF2F2", border: "#FECACA", color: "#B91C1C" },
  info: { background: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
  neutral: { background: "#F1F5F9", border: "#CBD5E1", color: "#475569" },
  success: { background: "#ECFDF5", border: "#A7F3D0", color: "#047857" },
  warning: { background: "#FFF7ED", border: "#FED7AA", color: "#C2410C" },
};

export interface CrudBadgeProps {
  children: ReactNode;
  tone?: CrudBadgeTone;
}

export const CrudBadge = ({ children, tone = "neutral" }: CrudBadgeProps) => {
  const styles = toneStyles[tone];

  return (
    <XStack
      background={styles.background}
      borderColor={styles.border as never}
      borderWidth={1}
      px="$2"
      py="$1"
      rounded="$6"
      style={{ alignItems: "center", alignSelf: "flex-start" }}
    >
      <Text color={styles.color as never} fontSize={10} fontWeight="$button">
        {children}
      </Text>
    </XStack>
  );
};
