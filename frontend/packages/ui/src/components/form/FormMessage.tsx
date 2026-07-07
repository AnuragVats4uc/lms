"use client";

import { Text } from "tamagui";

interface Props {
  message?: string;
}

export function FormMessage({
  message,
}: Props) {
  if (!message) return null;

  return (
    <Text
      color="$red10"
      mt="$1"
      fontSize="$caption"
      fontWeight="$caption"
      letterSpacing="$body"
    >
      {message}
    </Text>
  );
}
