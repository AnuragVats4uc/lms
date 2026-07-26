"use client";

import Link from "next/link";
import { Card, Text, YStack } from "@repo/ui";

export default function UnauthorizedPage() {
  return (
    <Card
      width="100%"
      maxWidth={460}
      borderRadius={8}
      backgroundColor="#FFFFFF"
      padding="$5"
    >
      <YStack gap="$3">
        <Text fontSize={24} fontWeight="700">
          Unauthorized
        </Text>
        <Text color="#647084" fontSize={14}>
          Your account is authenticated, but it does not have
          access to this area.
        </Text>
        <Link href="/login">Go to login</Link>
      </YStack>
    </Card>
  );
}
