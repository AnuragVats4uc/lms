import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { StudentLandingCard } from "@repo/types";

import { STUDENT_DASHBOARD_PATH } from "@/features/auth/routes";

import styles from "../StudentLandingPage.module.css";

type DestinationCardProps = {
  card: StudentLandingCard;
  onVisit: () => void;
};

export const DestinationCard = ({ card, onVisit }: DestinationCardProps) => {
  const isCustom = card.type === "CUSTOM";
  const cardClassName = [
    styles.card,
    isCustom ? styles.cardExternal : styles.cardPrimary,
  ]
    .filter(Boolean)
    .join(" ");
  const imagePanelClassName = [
    styles.imagePanel,
    isCustom ? styles.imagePanelExternal : styles.imagePanelPrimary,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassName}>
      <div aria-hidden="true" className={styles.cardGlow} />
      <div className={imagePanelClassName}>
        <div aria-hidden="true" className={styles.imageDecoration} />
        <Image
          alt={card.imageAlt ?? `${card.title} destination`}
          className={styles.cardImage}
          height={280}
          priority={!isCustom}
          src={
            card.imageUrl ??
            (card.type === "SYSTEM_LMS"
              ? "/images/dashboard.png"
              : "/images/external-links.png")
          }
          unoptimized={Boolean(card.imageUrl)}
          width={280}
        />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardCopy}>
          <h2 className={styles.cardTitle}>{card.title}</h2>
          <p className={styles.cardDescription}>{card.description}</p>
        </div>
        {isCustom ? (
          card.destinationUrl ? (
            <a
              className={`${styles.cta} ${styles.ctaSecondary}`}
              href={card.destinationUrl}
              onClick={onVisit}
              rel={card.openInNewTab ? "noreferrer" : undefined}
              target={card.openInNewTab ? "_blank" : undefined}
            >
              <span>{card.ctaLabel}</span>
              <ExternalLink
                aria-hidden="true"
                className={styles.ctaIcon}
                size={16}
                strokeWidth={2.25}
              />
            </a>
          ) : (
            <button
              className={`${styles.cta} ${styles.ctaDisabled}`}
              disabled
              type="button"
            >
              <span>{card.ctaLabel}</span>
              <ExternalLink
                aria-hidden="true"
                className={styles.ctaIcon}
                size={16}
                strokeWidth={2.25}
              />
            </button>
          )
        ) : (
          <Link
            className={`${styles.cta} ${styles.ctaPrimary}`}
            href={STUDENT_DASHBOARD_PATH}
            onClick={onVisit}
          >
            <span>{card.ctaLabel}</span>
            <ArrowRight
              aria-hidden="true"
              className={styles.ctaIcon}
              size={16}
              strokeWidth={2.35}
            />
          </Link>
        )}
      </div>
    </article>
  );
};
