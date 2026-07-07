"use client";

import { YStack } from "tamagui";
import { LoginCard } from "./components/LoginCard";

export default function LoginPage() {
  return (
    <YStack
      style={{ minHeight: '100vh' }}
      flex={1}
      justifyContent="center"
      alignItems="center"
    // backgroundColor="#F5FFFB"
    // padding="$6"
    >
      <LoginCard />
    </YStack>
  );
}