import { useRouter } from "next/navigation";
import { Play, UsersRound } from "lucide-react";
import { Card, Text, XStack, YStack } from "@repo/ui";

import { HeroVisual } from "./HeroVisual";

type WelcomeCardProps = {
  batch: string;
  continuePath: string;
  studentName: string;
};

export const WelcomeCard = ({
  batch,
  continuePath,
  studentName,
}: WelcomeCardProps) => {
  const router = useRouter();

  return (
    <Card className="student-welcome-card">
      <YStack className="student-welcome-decor decor-one" />
      <YStack className="student-welcome-decor decor-two" />
      <YStack className="student-welcome-decor decor-three" />
      <YStack className="student-welcome-copy">
        <Text className="student-welcome-kicker">Welcome back,</Text>
        <Text className="student-welcome-title">
          {studentName} <span aria-hidden="true">{"\u{1F44B}"}</span>
        </Text>
        <Text className="student-welcome-subtitle">
          You&apos;re doing great! Keep learning and growing.
        </Text>
        <XStack className="student-batch-badge">
          <UsersRound
            aria-hidden="true"
            color="#52627A"
            size={17}
            strokeWidth={2.1}
          />
          <Text className="student-batch-text">Batch: {batch}</Text>
        </XStack>
        <button
          aria-label="Continue learning"
          className="student-primary-action"
          onClick={() => router.push(continuePath)}
          type="button"
        >
          <Play aria-hidden="true" fill="#FFFFFF" size={16} strokeWidth={0} />
          <span className="student-primary-action-text">Continue Learning</span>
        </button>
      </YStack>
      <HeroVisual />
    </Card>
  );
};
