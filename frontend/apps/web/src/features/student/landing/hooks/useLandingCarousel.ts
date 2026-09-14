import {
  type UIEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { LandingCarouselLayout } from "../types";
import { calculateCarouselLayout } from "../utils/calculateCarouselLayout";
import { findActiveCarouselCard } from "../utils/findActiveCarouselCard";
import { scrollToCarouselCard } from "../utils/scrollToCarouselCard";

const initialLayout: LandingCarouselLayout = {
  cardWidth: 320,
  visibleCards: 1,
};

export const useLandingCarousel = (cardCount: number, enabled: boolean) => {
  const [activeCard, setActiveCard] = useState(0);
  const [layout, setLayout] = useState(initialLayout);
  const cardsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = cardsRef.current;
    if (!container) return;

    const updateLayout = () => {
      const width = container.clientWidth;
      if (!width) return;

      const nextLayout = calculateCarouselLayout(width, cardCount);
      setLayout((current) =>
        current.visibleCards === nextLayout.visibleCards &&
        Math.abs(current.cardWidth - nextLayout.cardWidth) < 0.5
          ? current
          : nextLayout,
      );
      setActiveCard((current) =>
        Math.min(current, Math.max(0, cardCount - nextLayout.visibleCards)),
      );
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(container);

    return () => observer.disconnect();
  }, [cardCount, enabled]);

  const handleScroll = useCallback<UIEventHandler<HTMLElement>>(
    (event) => {
      const closest = findActiveCarouselCard(event.currentTarget);
      setActiveCard(
        Math.min(closest, Math.max(0, cardCount - layout.visibleCards)),
      );
    },
    [cardCount, layout.visibleCards],
  );

  const showCard = useCallback(
    (index: number) => scrollToCarouselCard(cardsRef.current, index),
    [],
  );

  return {
    activeCard,
    cardsRef,
    handleScroll,
    layout,
    showCard,
  };
};
