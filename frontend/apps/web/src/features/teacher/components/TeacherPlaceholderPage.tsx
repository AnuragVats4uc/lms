"use client";

import { AppCard, Text, YStack } from "@repo/ui";

interface TeacherPlaceholderPageProps {
  title: string;
  description: string;
}

export function TeacherPlaceholderPage({
  title,
  description,
}: TeacherPlaceholderPageProps) {
  return (
    <YStack gap="$4">
      <Text color="#172033" fontSize={26} fontWeight="700">
        {title}
      </Text>
      <AppCard rounded="$3">
        <Text color="#647084" fontSize={14}>
          {description}
        </Text>
      </AppCard>
    </YStack>
  );
}
