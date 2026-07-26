"use client";

import { YStack } from "@repo/ui";

export function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <YStack
      p="$4"
      style={{
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      {children}
    </YStack>
  );
}
