"use client";

import type { ReactNode } from "react";
import { Button } from "@repo/ui";

interface OrganizationHeaderActionProps {
  children: ReactNode;
  icon?: ReactNode;
  onPress?: () => void;
  primary?: boolean;
}

export function OrganizationHeaderAction({
  children,
  icon,
  onPress,
  primary,
}: OrganizationHeaderActionProps) {
  return (
    <Button
      aria-label={typeof children === "string" ? children : undefined}
      background={primary ? "#059669" : "#FFFFFF"}
      borderColor={primary ? "#059669" : "#D8E1EC"}
      borderWidth={1}
      height={42}
      hoverStyle={{
        background: primary ? "#047857" : "#F8FBFD",
        scale: 1.01,
      }}
      onPress={onPress}
      pressStyle={{ scale: 0.98 }}
      px="$4"
      rounded="$4"
      style={{
        boxShadow: primary
          ? "0 10px 18px rgba(5, 150, 105, 0.18)"
          : "0 8px 20px rgba(15, 23, 42, 0.035)",
        transition: "transform 160ms ease, background-color 160ms ease",
      }}
    >
      {icon}
      <Button.Text
        color={primary ? "#FFFFFF" : "#0F1D3A"}
        fontSize="$caption"
        fontWeight="$button"
      >
        {children}
      </Button.Text>
    </Button>
  );
}
