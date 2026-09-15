import type { StudentLandingCard } from "@repo/types";
import type { LandingCardMoveDirection } from "../../types";
import styles from "../../StudentLandingCardsPage.module.css";
import { LandingCardsEmptyState } from "../states/LandingCardsEmptyState";
import { LandingCardRow } from "./LandingCardRow";

export const LandingCardsList = ({
  cards,
  customCards,
  deleting,
  onDelete,
  onEdit,
  onMove,
  reordering,
}: {
  cards: StudentLandingCard[];
  customCards: StudentLandingCard[];
  deleting: boolean;
  onDelete: (card: StudentLandingCard) => void;
  onEdit: (card: StudentLandingCard) => void;
  onMove: (id: number, direction: LandingCardMoveDirection) => void;
  reordering: boolean;
}) =>
  cards.length ? (
    <div className={styles.cardList}>
      {cards.map((card) => (
        <LandingCardRow
          card={card}
          customCount={customCards.length}
          customIndex={customCards.findIndex((item) => item.id === card.id)}
          deleting={deleting}
          key={card.uuid}
          onDelete={onDelete}
          onEdit={onEdit}
          onMove={onMove}
          reordering={reordering}
        />
      ))}
    </div>
  ) : (
    <LandingCardsEmptyState />
  );
