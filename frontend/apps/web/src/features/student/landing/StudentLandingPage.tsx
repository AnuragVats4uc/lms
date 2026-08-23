"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { Text, XStack, YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import { STUDENT_DASHBOARD_PATH } from "@/features/auth/routes";

import styles from "./StudentLandingPage.module.css";

const externalDestination = {
  description:
    process.env.NEXT_PUBLIC_STUDENT_EXTERNAL_PORTAL_DESCRIPTION?.trim() ||
    "Continue to connected learning resources and student services.",

  name:
    process.env.NEXT_PUBLIC_STUDENT_EXTERNAL_PORTAL_NAME?.trim() ||
    "External Link",

  url:
    process.env.NEXT_PUBLIC_STUDENT_EXTERNAL_PORTAL_URL?.trim() || "",
};

const destinations = [
  {
    cta: "Go to Dashboard",
    description:
      "Access courses, exams, learning resources and your academic progress.",
    href: STUDENT_DASHBOARD_PATH,
    imageAlt: "Illustration of academic dashboard resources and progress",
    imageSrc: "/images/dashboard.png",
    isExternal: false,
    title: "Dashboard",
  },
  {
    cta: "Explore Now",
    description: externalDestination.description,
    href: externalDestination.url,
    imageAlt: "Illustration of an external learning portal",
    imageSrc: "/images/external-links.png",
    isExternal: true,
    title: externalDestination.name,
  },
];

export const StudentLandingPage = () => {
  const { currentUser } = useAuthSession();

  const studentName = currentUser?.firstName?.trim();

  return (
    <main className={styles.pageShell}>
      <div
        aria-hidden="true"
        className={styles.backgroundPattern}
      />

      <YStack className={styles.content}>
        {/* LMS Brand */}
        <XStack
          aria-label="The LMS Student Portal"
          className={styles.brand}
        >
          <span className={styles.brandMark}>
            <GraduationCap
              aria-hidden="true"
              size={21}
              strokeWidth={2.3}
            />
          </span>

          <YStack className={styles.brandCopy}>
            <Text className={styles.brandName}>
              The LMS
            </Text>

            <Text className={styles.brandMeta}>
              Student Portal
            </Text>
          </YStack>
        </XStack>

        {/* Welcome */}
        <YStack className={styles.headingBlock}>
          <span className={styles.kicker}>
            <Sparkles
              aria-hidden="true"
              size={14}
              strokeWidth={2.25}
            />

            Student gateway
          </span>

          <h1 className={styles.title}>
            Welcome to The LMS
          </h1>

          <p className={styles.subtitle}>
            {studentName
              ? `Good to see you, ${studentName}. Choose where you'd like to continue.`
              : "Choose where you'd like to continue."}
          </p>
        </YStack>

        {/* Destination Cards */}
        <section
          aria-label="Student destination choices"
          className={styles.cardGrid}
        >
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.title}
              {...destination}
            />
          ))}
        </section>

        {/* Mobile indicator */}
        <div
          aria-hidden="true"
          className={styles.mobileSwipeHint}
        >
          <span className={styles.swipeDotActive} />
          <span className={styles.swipeDot} />

          <span className={styles.swipeText}>
            Swipe to explore
          </span>
        </div>
      </YStack>
    </main>
  );
};

interface DestinationCardProps {
  cta: string;
  description: string;
  href: string;
  imageAlt: string;
  imageSrc: string;
  isExternal: boolean;
  title: string;
}

const DestinationCard = ({
  cta,
  description,
  href,
  imageAlt,
  imageSrc,
  isExternal,
  title,
}: DestinationCardProps) => {
  const cardClassName = [
    styles.card,
    isExternal
      ? styles.cardExternal
      : styles.cardPrimary,
  ]
    .filter(Boolean)
    .join(" ");

  const imagePanelClassName = [
    styles.imagePanel,
    isExternal
      ? styles.imagePanelExternal
      : styles.imagePanelPrimary,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassName}>
      <div
        aria-hidden="true"
        className={styles.cardGlow}
      />

      <div className={imagePanelClassName}>
        <div
          aria-hidden="true"
          className={styles.imageDecoration}
        />

        <Image
          alt={imageAlt}
          className={styles.cardImage}
          height={280}
          priority={!isExternal}
          src={imageSrc}
          width={280}
        />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardCopy}>
          <h2 className={styles.cardTitle}>
            {title}
          </h2>

          <p className={styles.cardDescription}>
            {description}
          </p>
        </div>

        {isExternal ? (
          href ? (
            <a
              className={`${styles.cta} ${styles.ctaSecondary}`}
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              <span>{cta}</span>

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
              <span>{cta}</span>

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
            href={href}
          >
            <span>{cta}</span>

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