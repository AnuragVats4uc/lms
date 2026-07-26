"use client";

import Link from "next/link";
import { Card, Text, YStack } from "@repo/ui";

export default function ForgotPasswordPage() {
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
          Forgot Password
        </Text>
        <Text color="#647084" fontSize={14}>
          Password recovery is not available in the backend API
          yet. This route is ready for the shared auth flow.
        </Text>
        <Link href="/login">Back to login</Link>
      </YStack>
    </Card>
  );
}
