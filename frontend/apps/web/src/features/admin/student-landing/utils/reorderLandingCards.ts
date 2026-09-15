import type { StudentLandingCard } from "@repo/types";
import type { LandingCardMoveDirection } from "../types";

export const reorderLandingCards = (
  cards: StudentLandingCard[],
  cardId: number,
  direction: LandingCardMoveDirection,
) => {
  const ids = cards.map((card) => card.id);
  const from = ids.indexOf(cardId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  [ids[from], ids[to]] = [ids[to]!, ids[from]!];
  return ids;
};
