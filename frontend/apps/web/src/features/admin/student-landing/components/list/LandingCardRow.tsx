import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { StudentLandingCard } from "@repo/types";
import styles from "../../StudentLandingCardsPage.module.css";
import { resolveLandingCardImage } from "../../utils/landingCardImage";
import type { LandingCardMoveDirection } from "../../types";

export const LandingCardRow = ({
  card,
  customCount,
  customIndex,
  deleting,
  onDelete,
  onEdit,
  onMove,
  reordering,
}: {
  card: StudentLandingCard;
  customCount: number;
  customIndex: number;
  deleting: boolean;
  onDelete: (card: StudentLandingCard) => void;
  onEdit: (card: StudentLandingCard) => void;
  onMove: (id: number, direction: LandingCardMoveDirection) => void;
  reordering: boolean;
}) => (
  <article className={styles.cardRow}>
    <div className={styles.preview}>
      <img
        alt={card.imageAlt ?? card.title}
        src={resolveLandingCardImage(card)}
      />
    </div>
    <div className={styles.cardCopy}>
      <div className={styles.cardTitleLine}>
        <h2>{card.title}</h2>
        <span>
          {card.type === "SYSTEM_LMS"
            ? "Fixed LMS card"
            : card.isActive
              ? "Visible"
              : "Hidden"}
        </span>
      </div>
      <p>{card.description}</p>
      <div className={styles.cardMeta}>
        <span>CTA: {card.ctaLabel}</span>
        <a
          href={card.destinationUrl}
          rel="noreferrer"
          target={card.openInNewTab ? "_blank" : undefined}
        >
          Open destination <ExternalLink size={12} />
        </a>
      </div>
    </div>
    <div className={styles.actions}>
      {card.type === "CUSTOM" ? (
        <>
          <button
            aria-label={`Move ${card.title} up`}
            disabled={customIndex <= 0 || reordering}
            onClick={() => onMove(card.id, -1)}
            type="button"
          >
            <ArrowUp size={16} />
          </button>
          <button
            aria-label={`Move ${card.title} down`}
            disabled={customIndex === customCount - 1 || reordering}
            onClick={() => onMove(card.id, 1)}
            type="button"
          >
            <ArrowDown size={16} />
          </button>
        </>
      ) : null}
      <button
        aria-label={`Edit ${card.title}`}
        onClick={() => onEdit(card)}
        type="button"
      >
        <Pencil size={16} />
      </button>
      {card.type === "CUSTOM" ? (
        <button
          aria-label={`Delete ${card.title}`}
          className={styles.dangerButton}
          disabled={deleting}
          onClick={() => onDelete(card)}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      ) : null}
    </div>
  </article>
);
