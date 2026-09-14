import { ArrowLeft, ArrowRight } from "lucide-react";

import styles from "../../StudentLandingPage.module.css";

type CarouselControlsProps = {
  activeCard: number;
  lastCardIndex: number;
  onNext: () => void;
  onPrevious: () => void;
};

export const CarouselControls = ({
  activeCard,
  lastCardIndex,
  onNext,
  onPrevious,
}: CarouselControlsProps) => (
  <div className={styles.carouselControls}>
    <button
      aria-controls="student-destination-carousel"
      aria-label="Previous destination"
      className={styles.previousButton}
      disabled={activeCard === 0}
      onClick={onPrevious}
      type="button"
    >
      <ArrowLeft aria-hidden="true" size={17} />
    </button>
    <button
      aria-controls="student-destination-carousel"
      aria-label="Next destination"
      className={styles.nextButton}
      disabled={activeCard >= lastCardIndex}
      onClick={onNext}
      type="button"
    >
      <ArrowRight aria-hidden="true" size={17} />
    </button>
  </div>
);
