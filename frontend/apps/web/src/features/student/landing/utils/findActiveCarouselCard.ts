export const findActiveCarouselCard = (container: HTMLElement) => {
  const cards = Array.from(container.children) as HTMLElement[];
  if (!cards.length) return 0;

  return cards.reduce(
    (closestIndex, card, index) =>
      Math.abs(card.offsetLeft - container.offsetLeft - container.scrollLeft) <
      Math.abs(
        cards[closestIndex]!.offsetLeft -
          container.offsetLeft -
          container.scrollLeft,
      )
        ? index
        : closestIndex,
    0,
  );
};
