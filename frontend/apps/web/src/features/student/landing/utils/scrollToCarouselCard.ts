const carouselAnimations = new WeakMap<
  HTMLElement,
  { frame: number; originalScrollBehavior: string }
>();

export const scrollToCarouselCard = (
  container: HTMLElement | null,
  index: number,
) => {
  const card = container?.children.item(index) as HTMLElement | null;
  if (!container || !card) return;

  const targetLeft = card.offsetLeft - container.offsetLeft;
  const startLeft = container.scrollLeft;
  const distance = targetLeft - startLeft;
  if (Math.abs(distance) < 1) return;

  const previousAnimation = carouselAnimations.get(container);
  if (previousAnimation) cancelAnimationFrame(previousAnimation.frame);

  const originalScrollBehavior =
    previousAnimation?.originalScrollBehavior ?? container.style.scrollBehavior;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion) {
    container.scrollLeft = targetLeft;
    return;
  }

  const startedAt = performance.now();
  const duration = 380;
  container.style.scrollBehavior = "auto";

  const animate = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const easedProgress = 1 - Math.pow(1 - progress, 4);
    container.scrollLeft = startLeft + distance * easedProgress;

    if (progress < 1) {
      const frame = requestAnimationFrame(animate);
      carouselAnimations.set(container, { frame, originalScrollBehavior });
      return;
    }

    container.style.scrollBehavior = originalScrollBehavior;
    carouselAnimations.delete(container);
  };

  const frame = requestAnimationFrame(animate);
  carouselAnimations.set(container, { frame, originalScrollBehavior });
};
