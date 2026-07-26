"use client";

import { Card, Text, YStack } from "@repo/ui";

interface StudentPlaceholderPageProps {
  title: string;
  description: string;
}

export function StudentPlaceholderPage({
  title,
  description,
}: StudentPlaceholderPageProps) {
  return (
    <YStack gap="$4">
      <Text
        color="#172033"
        fontSize={26}
        fontWeight="700"
      >
        {title}
      </Text>
      <Card
        borderColor="#DFE6EE"
        borderRadius={8}
        borderWidth={1}
        backgroundColor="#FFFFFF"
        padding="$4"
      >
        <Text color="#647084" fontSize={14}>
          {description}
        </Text>
      </Card>
    </YStack>
  );
}
