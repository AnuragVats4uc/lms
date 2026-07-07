"use client";

import { Text, YStack } from "@repo/ui";

export function LoginHeader() {
  return (
    <YStack gap="$2">
      <Text
        fontSize={34}
        fontWeight="700"
      >
        Welcome Back
      </Text>

      <Text color="#6B7280">
        Login to continue your learning journey
      </Text>
    </YStack>
  );
}