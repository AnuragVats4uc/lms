"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";
import { studentLandingApi } from "@repo/api";
import type { StudentLandingCard } from "@repo/types";

import { STUDENT_DASHBOARD_PATH } from "@/features/auth/routes";
import {
  clearStudentWelcome,
  hasStudentWelcome,
} from "@/features/auth/student-welcome-session";

import styles from "./StudentLandingPage.module.css";

const fallbackLmsCard: StudentLandingCard = {
  id: 0,
  uuid: "00000000-0000-4000-8000-000000000000",
  organizationId: 0,
  type: "SYSTEM_LMS",
  systemKey: "LMS",
  title: "LMS",
  description:
    "Access courses, exams, learning resources and your academic progress.",
  ctaLabel: "Go to LMS",
  destinationUrl: STUDENT_DASHBOARD_PATH,
  imageUrl: null,
  imageAlt: "Illustration of academic dashboard resources and progress",
  openInNewTab: false,
  displayOrder: 0,
  isActive: true,
  createdAt: "",
  updatedAt: "",
  deletedAt: null,
};

export const StudentLandingPage = () => {
  const { currentUser } = useAuthSession();
  const router = useRouter();
  const accessResolved = useRef(false);
  const [isWelcomeAvailable, setIsWelcomeAvailable] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [carouselLayout, setCarouselLayout] = useState({
    cardWidth: 320,
    visibleCards: 1,
  });
  const cardsRef = useRef<HTMLElement>(null);
  const viewRecorded = useRef(false);
  const cardsQuery = useQuery({
    enabled: isWelcomeAvailable,
    queryFn: () => studentLandingApi.listStudent(),
    queryKey: ["student", "landing-cards"],
    staleTime: 60_000,
  });
  const cards = cardsQuery.data ?? [fallbackLmsCard];

  const studentName = currentUser?.firstName?.trim();

  useEffect(() => {
    if (!currentUser || accessResolved.current) return;

    accessResolved.current = true;
    if (!hasStudentWelcome(currentUser.uuid)) {
      router.replace(STUDENT_DASHBOARD_PATH);
      return;
    }

    // This state is resolved from sessionStorage, an external browser system.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsWelcomeAvailable(true);
  }, [currentUser, router]);

  useEffect(() => {
    if (!isWelcomeAvailable || viewRecorded.current) return;
    viewRecorded.current = true;
    void studentLandingApi.recordView(crypto.randomUUID()).catch(() => undefined);
  }, [isWelcomeAvailable]);

  useEffect(() => {
    if (!isWelcomeAvailable) return;

    const container = cardsRef.current;
    if (!container) return;

    const updateLayout = () => {
      const width = container.clientWidth;
      if (!width) return;

      const gap = 16;
      const minimumCardWidth = width < 600 ? 250 : 280;
      const visibleCards = Math.max(
        1,
        Math.min(
          cards.length,
          4,
          Math.floor((width + gap) / (minimumCardWidth + gap)),
        ),
      );
      const cardWidth = Math.min(
        360,
        (width - gap * Math.max(0, visibleCards - 1)) / visibleCards,
      );

      setCarouselLayout((current) =>
        current.visibleCards === visibleCards &&
        Math.abs(current.cardWidth - cardWidth) < 0.5
          ? current
          : { cardWidth, visibleCards },
      );
      setActiveCard((current) =>
        Math.min(current, Math.max(0, cards.length - visibleCards)),
      );
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(container);

    return () => observer.disconnect();
  }, [cards.length, isWelcomeAvailable]);

  const handleVisit = useCallback((card: StudentLandingCard) => {
    clearStudentWelcome();

    if (card.id === 0) return;
    void studentLandingApi
      .recordClick(card.uuid, crypto.randomUUID())
      .catch(() => undefined);
  }, []);

  if (!isWelcomeAvailable) return null;

  return (
    <main className={styles.pageShell}>
      <div aria-hidden="true" className={styles.backgroundPattern} />

      <YStack className={styles.content}>
        {/* Organization Brand */}
        <div className={styles.organizationLogo}>
          <Image
            alt="Keonjhar Digital Library"
            className={styles.organizationLogoImage}
            height={500}
            priority
            quality={100}
            sizes="(max-width: 600px) and (max-height: 620px) 120px, (max-width: 600px) 190px, (max-height: 620px) 144px, (max-height: 760px) 200px, 270px"
            src="/images/keonjhar-logo.png"
            width={500}
          />
        </div>

        {/* The LMS Student Portal badge is intentionally hidden. */}

        {/* Welcome */}
        <YStack className={styles.headingBlock}>
          {/* Student gateway label is intentionally hidden. */}

          <h1 className={styles.title}>Welcome to The LMS</h1>

          <p className={styles.subtitle}>
            {studentName
              ? `Good to see you, ${studentName}. Choose where you'd like to continue.`
              : "Choose where you'd like to continue."}
          </p>
        </YStack>

        {/* Destination Cards */}
        <div className={styles.carouselFrame}>
          <section
            aria-label="Student destination choices"
            className={`${styles.cardGrid} ${
              cards.length <= carouselLayout.visibleCards
                ? styles.cardGridCentered
                : ""
            }`}
            id="student-destination-carousel"
            ref={cardsRef}
            style={
              {
                "--landing-card-width": `${carouselLayout.cardWidth}px`,
              } as CSSProperties
            }
            onScroll={(event) => {
              const row = event.currentTarget;
              const children = Array.from(row.children) as HTMLElement[];
              if (!children.length) return;
              const closest = children.reduce(
                (best, child, index) =>
                  Math.abs(child.offsetLeft - row.offsetLeft - row.scrollLeft) <
                  Math.abs(
                    children[best]!.offsetLeft -
                      row.offsetLeft -
                      row.scrollLeft,
                  )
                    ? index
                    : best,
                0,
              );
              setActiveCard(
                Math.min(
                  closest,
                  Math.max(0, cards.length - carouselLayout.visibleCards),
                ),
              );
            }}
          >
            {cards.map((card) => (
              <DestinationCard
                card={card}
                key={card.uuid}
                onVisit={() => handleVisit(card)}
              />
            ))}
          </section>

          {cards.length > carouselLayout.visibleCards ? (
            <div className={styles.carouselControls}>
              <button
                aria-controls="student-destination-carousel"
                aria-label="Previous destination"
                className={styles.previousButton}
                disabled={activeCard === 0}
                onClick={() => scrollCards(cardsRef.current, activeCard - 1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={17} />
              </button>
              <button
                aria-controls="student-destination-carousel"
                aria-label="Next destination"
                className={styles.nextButton}
                disabled={
                  activeCard >=
                  Math.max(0, cards.length - carouselLayout.visibleCards)
                }
                onClick={() => scrollCards(cardsRef.current, activeCard + 1)}
                type="button"
              >
                <ArrowRight aria-hidden="true" size={17} />
              </button>
            </div>
          ) : null}
        </div>

        {/* Mobile indicator */}
        <div aria-hidden="true" className={styles.mobileSwipeHint}>
          {cards.map((card, index) => (
            <span
              className={index === activeCard ? styles.swipeDotActive : styles.swipeDot}
              key={card.uuid}
            />
          ))}

          <span className={styles.swipeText}>Swipe to explore</span>
        </div>
      </YStack>
    </main>
  );
};

interface DestinationCardProps { card: StudentLandingCard; onVisit: () => void }

const DestinationCard = ({
  card,
  onVisit,
}: DestinationCardProps) => {
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

const carouselAnimations = new WeakMap<
  HTMLElement,
  { frame: number; originalScrollBehavior: string }
>();

function scrollCards(container: HTMLElement | null, index: number) {
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
}
