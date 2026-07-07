"use client";

import { Text } from "tamagui";

interface Props {
  id?: string;
  message?: string;
}

export function FormMessage({
  id,
  message,
}: Props) {
  if (!message) return null;

  return (
    <Text
      id={id}
      color="$red10"
      mt="$1"
      fontSize="$caption"
      fontWeight="$caption"
      letterSpacing="$body"
      role="alert"
    >
      {message}
    </Text>
  );
}
