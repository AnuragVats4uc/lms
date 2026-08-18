"use client";

import { YStack } from "@repo/ui";

export function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <YStack
      style={{
        alignItems: "stretch",
        backgroundColor: "#ECFDF5",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {children}
    </YStack>
  );
}
