"use client";

import { BookOpen, CalendarDays, FileText } from "lucide-react";
import { Card, Text, XStack, YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import { getUserDisplayName } from "@/features/shared/access";

const summaryCards = [
  {
    icon: BookOpen,
    label: "My Courses",
    value: "Coming soon",
  },
  {
    icon: FileText,
    label: "Assignments",
    value: "Coming soon",
  },
  {
    icon: CalendarDays,
    label: "Schedule",
    value: "Coming soon",
  },
];

export function StudentDashboardPage() {
  const { currentUser } = useAuthSession();

  return (
    <YStack gap="$4">
      <YStack>
        <Text
          color="#172033"
          fontSize={28}
          fontWeight="700"
        >
          Welcome, {getUserDisplayName(currentUser)}
        </Text>
        <Text color="#647084" fontSize={14}>
          Student learning workspace for courses,
          assignments, exams, attendance, and schedule.
        </Text>
      </YStack>

      <XStack flexWrap="wrap" gap="$3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.label}
              width={260}
              borderColor="#DFE6EE"
              borderRadius={8}
              borderWidth={1}
              backgroundColor="#FFFFFF"
              padding="$4"
            >
              <YStack gap="$3">
                <XStack
                  style={{
                    alignItems: "center",
                    backgroundColor: "#E7F5F1",
                    borderRadius: 8,
                    height: 42,
                    justifyContent: "center",
                    width: 42,
                  }}
                >
                  <Icon
                    aria-hidden="true"
                    size={21}
                    strokeWidth={2.2}
                    color="#0A7A5F"
                  />
                </XStack>
                <Text color="#172033" fontWeight="700">
                  {card.label}
                </Text>
                <Text color="#647084" fontSize={14}>
                  {card.value}
                </Text>
              </YStack>
            </Card>
          );
        })}
      </XStack>
    </YStack>
  );
}
