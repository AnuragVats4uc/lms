"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

import { YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import { STUDENT_DASHBOARD_PATH } from "@/features/auth/routes";
import { consumeStudentWelcome } from "@/features/auth/student-welcome-session";

import styles from "./StudentLandingPage.module.css";

const externalDestination = {
  description:
    process.env.NEXT_PUBLIC_STUDENT_EXTERNAL_PORTAL_DESCRIPTION?.trim() ||
    "Continue to connected learning resources and student services.",

  name:
    process.env.NEXT_PUBLIC_STUDENT_EXTERNAL_PORTAL_NAME?.trim() ||
    "External Link",

  url: process.env.NEXT_PUBLIC_STUDENT_EXTERNAL_PORTAL_URL?.trim() || "",
};

const destinations = [
  {
    cta: "Go to LMS",
    description:
      "Access courses, exams, learning resources and your academic progress.",
    href: STUDENT_DASHBOARD_PATH,
    imageAlt: "Illustration of academic dashboard resources and progress",
    imageSrc: "/images/dashboard.png",
    isExternal: false,
    title: "LMS",
  },
  {
    cta: "Explore App",
    description: externalDestination.description,
    href: externalDestination.url,
    imageAlt: "Illustration of an external learning portal",
    imageSrc: "/images/external-links.png",
    isExternal: true,
    title: "Explore App",
  },
];

export const StudentLandingPage = () => {
  const { currentUser } = useAuthSession();
  const router = useRouter();
  const accessResolved = useRef(false);
  const [isWelcomeAvailable, setIsWelcomeAvailable] = useState(false);

  const studentName = currentUser?.firstName?.trim();

  useEffect(() => {
    if (!currentUser || accessResolved.current) return;

    accessResolved.current = true;
    if (!consumeStudentWelcome(currentUser.uuid)) {
      router.replace(STUDENT_DASHBOARD_PATH);
      return;
    }

    // This state is resolved from sessionStorage, an external browser system.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsWelcomeAvailable(true);
  }, [currentUser, router]);

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
        <section
          aria-label="Student destination choices"
          className={styles.cardGrid}
        >
          {destinations.map((destination) => (
            <DestinationCard key={destination.title} {...destination} />
          ))}
        </section>

        {/* Mobile indicator */}
        <div aria-hidden="true" className={styles.mobileSwipeHint}>
          <span className={styles.swipeDotActive} />
          <span className={styles.swipeDot} />

          <span className={styles.swipeText}>Swipe to explore</span>
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
    isExternal ? styles.cardExternal : styles.cardPrimary,
  ]
    .filter(Boolean)
    .join(" ");

  const imagePanelClassName = [
    styles.imagePanel,
    isExternal ? styles.imagePanelExternal : styles.imagePanelPrimary,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassName}>
      <div aria-hidden="true" className={styles.cardGlow} />

      <div className={imagePanelClassName}>
        <div aria-hidden="true" className={styles.imageDecoration} />

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
          <h2 className={styles.cardTitle}>{title}</h2>

          <p className={styles.cardDescription}>{description}</p>
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
          <Link className={`${styles.cta} ${styles.ctaPrimary}`} href={href}>
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
