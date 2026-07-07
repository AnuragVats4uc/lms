"use client";

import { Text, YStack } from "@repo/ui";

export function LoginFooter() {
    return (
        <YStack
            verticalAlign="center"
            marginStart="$4"
        >
            <Text color="#6B7280">
                Don't have an account?
            </Text>

            <Text
                color="#10B981"
                fontWeight="700"
            >
                Register
            </Text>
        </YStack>
    );
}