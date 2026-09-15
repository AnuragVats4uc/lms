import type { StudentLandingCard } from "@repo/types";
import type { LandingCardForm } from "../types";

export const toLandingCardForm = (
  card: StudentLandingCard,
): LandingCardForm => ({
  title: card.title,
  description: card.description,
  ctaLabel: card.ctaLabel,
  destinationUrl: card.destinationUrl,
  imageUrl: card.imageUrl ?? "",
  imageAlt: card.imageAlt ?? "",
  openInNewTab: card.openInNewTab,
  isActive: card.isActive,
});

export const landingCardCommonPayload = (form: LandingCardForm) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  ctaLabel: form.ctaLabel.trim(),
  imageUrl: form.imageUrl.trim() || null,
  imageAlt: form.imageAlt.trim() || null,
});
