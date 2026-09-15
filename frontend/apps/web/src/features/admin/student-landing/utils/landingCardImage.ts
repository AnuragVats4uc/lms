import type { StudentLandingCard } from "@repo/types";
import { landingCardImageMaxBytes, landingCardImageTypes } from "../constants";

export const validateLandingCardImage = (file: File) => {
  if (!landingCardImageTypes.includes(file.type))
    return "Image must be JPEG, PNG, or WebP.";
  if (file.size > landingCardImageMaxBytes)
    return "Image must not exceed 5 MB.";
  return null;
};

export const resolveLandingCardImage = (card: StudentLandingCard) =>
  card.imageUrl ??
  (card.type === "SYSTEM_LMS"
    ? "/images/dashboard.png"
    : "/images/external-links.png");
