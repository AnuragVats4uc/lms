"use client";

import { Card, YStack } from "@repo/ui";

import { LoginHeader } from "./LoginHeader";
import { LoginFooter } from "./LoginFooter";

export function LoginCard() {
    return (
        <Card
            width={420}
            padding="$7"
            borderRadius="$6"
            backgroundColor="white"
            elevation="$3"
        >
            <YStack gap="$5">
                <LoginHeader />

                {/* Form comes here */}
                <LoginFooter />
            </YStack>
        </Card>
    );
}