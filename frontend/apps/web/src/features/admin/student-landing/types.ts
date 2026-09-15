import type { CreateStudentLandingCardRequest } from "@repo/types";

export type LandingCardForm = Omit<
  CreateStudentLandingCardRequest,
  "imageUrl" | "imageAlt"
> & {
  imageAlt: string;
  imageUrl: string;
  isActive: boolean;
};

export type LandingCardMoveDirection = -1 | 1;
