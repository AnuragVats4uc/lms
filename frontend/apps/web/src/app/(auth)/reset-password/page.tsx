"use client";

import Link from "next/link";
import { Card, Text, YStack } from "@repo/ui";

export default function ResetPasswordPage() {
  return (
    <Card
      width="100%"
      maxWidth={420}
      borderRadius={8}
      backgroundColor="#FFFFFF"
      padding="$5"
    >
      <YStack gap="$3">
        <Text fontSize={24} fontWeight="700">
          Reset Password
        </Text>
        <Text color="#647084" fontSize={14}>
          Reset password endpoints are not implemented in the
          backend yet. This route is isolated under the shared
          auth group.
        </Text>
        <Link href="/login">Back to login</Link>
      </YStack>
    </Card>
  );
}
