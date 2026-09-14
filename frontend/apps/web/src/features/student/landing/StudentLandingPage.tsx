"use client";

import { YStack } from "@repo/ui";

import { DestinationCarousel } from "./components/carousel/DestinationCarousel";
import { CarouselSwipeIndicator } from "./components/carousel/CarouselSwipeIndicator";
import { LandingBrand } from "./components/LandingBrand";
import { LandingWelcomeHeader } from "./components/LandingWelcomeHeader";
import { useStudentLanding } from "./hooks/useStudentLanding";

import styles from "./StudentLandingPage.module.css";

export const StudentLandingPage = () => {
  const { cards, carousel, handleVisit, isWelcomeAvailable, studentName } =
    useStudentLanding();

  if (!isWelcomeAvailable) return null;

  return (
    <main className={styles.pageShell}>
      <div aria-hidden="true" className={styles.backgroundPattern} />
      <YStack className={styles.content}>
        <LandingBrand />
        <LandingWelcomeHeader studentName={studentName} />
        <DestinationCarousel
          activeCard={carousel.activeCard}
          cards={cards}
          cardsRef={carousel.cardsRef}
          layout={carousel.layout}
          onScroll={carousel.handleScroll}
          onShowCard={carousel.showCard}
          onVisit={handleVisit}
        />
        <CarouselSwipeIndicator
          activeCard={carousel.activeCard}
          cards={cards}
        />
      </YStack>
    </main>
  );
};
