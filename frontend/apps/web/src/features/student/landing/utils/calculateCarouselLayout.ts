import type { LandingCarouselLayout } from "../types";

const CARD_GAP = 16;
const MAXIMUM_VISIBLE_CARDS = 4;
const MAXIMUM_CARD_WIDTH = 360;

export const calculateCarouselLayout = (
  containerWidth: number,
  cardCount: number,
): LandingCarouselLayout => {
  const minimumCardWidth = containerWidth < 600 ? 250 : 280;
  const visibleCards = Math.max(
    1,
    Math.min(
      cardCount,
      MAXIMUM_VISIBLE_CARDS,
      Math.floor((containerWidth + CARD_GAP) / (minimumCardWidth + CARD_GAP)),
    ),
  );

  return {
    cardWidth: Math.min(
      MAXIMUM_CARD_WIDTH,
      (containerWidth - CARD_GAP * Math.max(0, visibleCards - 1)) /
        visibleCards,
    ),
    visibleCards,
  };
};
