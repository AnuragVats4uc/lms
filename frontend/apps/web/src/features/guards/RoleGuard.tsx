"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner, YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import { UNAUTHORIZED_PATH } from "@/features/auth/routes";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const isAllowed =
    currentUser?.roles.some((role) =>
      allowedRoles.includes(role)
    ) ?? false;

  useEffect(() => {
    if (currentUser && !isAllowed) {
      router.replace(UNAUTHORIZED_PATH);
    }
  }, [currentUser, isAllowed, router]);

  if (!currentUser || !isAllowed) {
    return (
      <YStack
        style={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Spinner size="large" />
      </YStack>
    );
  }

  return <>{children}</>;
}
