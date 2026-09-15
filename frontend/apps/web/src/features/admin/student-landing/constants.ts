import type { LandingCardForm } from "./types";

export const defaultLandingCardForm: LandingCardForm = {
  title: "Explore App",
  description: "Continue to connected learning resources and student services.",
  ctaLabel: "Explore App",
  destinationUrl: "",
  imageUrl: "/images/external-links.png",
  imageAlt: "Illustration of a connected student learning application",
  openInNewTab: true,
  isActive: true,
};

export const landingCardImageTypes = ["image/jpeg", "image/png", "image/webp"];
export const landingCardImageMaxBytes = 5 * 1024 * 1024;
export const landingCardQueryKey = (organizationId: number | null) =>
  ["admin", "student-landing-cards", organizationId] as const;
