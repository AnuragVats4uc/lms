import type { CSSProperties, UIEventHandler, RefObject } from "react";
import type { StudentLandingCard } from "@repo/types";

import type { LandingCarouselLayout } from "../../types";
import { DestinationCard } from "../DestinationCard";
import { CarouselControls } from "./CarouselControls";

import styles from "../../StudentLandingPage.module.css";

type DestinationCarouselProps = {
  activeCard: number;
  cards: StudentLandingCard[];
  cardsRef: RefObject<HTMLElement | null>;
  layout: LandingCarouselLayout;
  onScroll: UIEventHandler<HTMLElement>;
  onShowCard: (index: number) => void;
  onVisit: (card: StudentLandingCard) => void;
};

export const DestinationCarousel = ({
  activeCard,
  cards,
  cardsRef,
  layout,
  onScroll,
  onShowCard,
  onVisit,
}: DestinationCarouselProps) => {
  const lastCardIndex = Math.max(0, cards.length - layout.visibleCards);
  const hasOverflow = cards.length > layout.visibleCards;

  return (
    <div className={styles.carouselFrame}>
      <section
        aria-label="Student destination choices"
        className={`${styles.cardGrid} ${
          hasOverflow ? "" : styles.cardGridCentered
        }`}
        id="student-destination-carousel"
        onScroll={onScroll}
        ref={cardsRef}
        style={
          {
            "--landing-card-width": `${layout.cardWidth}px`,
          } as CSSProperties
        }
      >
        {cards.map((card) => (
          <DestinationCard
            card={card}
            key={card.uuid}
            onVisit={() => onVisit(card)}
          />
        ))}
      </section>
      {hasOverflow ? (
        <CarouselControls
          activeCard={activeCard}
          lastCardIndex={lastCardIndex}
          onNext={() => onShowCard(activeCard + 1)}
          onPrevious={() => onShowCard(activeCard - 1)}
        />
      ) : null}
    </div>
  );
};
