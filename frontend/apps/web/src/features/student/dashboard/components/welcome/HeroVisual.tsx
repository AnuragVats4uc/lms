import { YStack } from "@repo/ui";

export const HeroVisual = () => (
  <YStack aria-hidden className="student-hero-visual">
    <YStack className="student-hero-book-stack">
      <YStack className="student-hero-cap">
        <YStack className="student-hero-cap-top" />
        <YStack className="student-hero-cap-base" />
        <YStack className="student-hero-tassel" />
      </YStack>
      <YStack className="student-hero-book book-one" />
      <YStack className="student-hero-book book-two" />
      <YStack className="student-hero-book book-three" />
    </YStack>
    <YStack className="student-hero-plant">
      <YStack className="student-hero-leaf leaf-one" />
      <YStack className="student-hero-leaf leaf-two" />
      <YStack className="student-hero-leaf leaf-three" />
      <YStack className="student-hero-pot" />
    </YStack>
    <YStack className="student-hero-mug" />
    <YStack className="student-hero-pen" />
  </YStack>
);
