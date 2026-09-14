import type { StudentLandingCard } from "@repo/types";

import styles from "../../StudentLandingPage.module.css";

export const CarouselSwipeIndicator = ({
  activeCard,
  cards,
}: {
  activeCard: number;
  cards: StudentLandingCard[];
}) => (
  <div aria-hidden="true" className={styles.mobileSwipeHint}>
    {cards.map((card, index) => (
      <span
        className={
          index === activeCard ? styles.swipeDotActive : styles.swipeDot
        }
        key={card.uuid}
      />
    ))}
    <span className={styles.swipeText}>Swipe to explore</span>
  </div>
);
