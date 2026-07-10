"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ImpersonationBanner,
  useAuthSession,
} from "@repo/auth";

import { CourseCard } from "./CourseCard";
import { Header } from "./Header";
import { HeroSection } from "./HeroSection";
import styles from "./Dashboard.module.css";

const courseRoutes = {
  mockTests: "/mock-tests",
  studyMaterials: "/study-materials",
} as const;

export function DashboardPage() {
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const studentName =
    getStudentDisplayName(currentUser) || "Siddhant Kumar";
  const classNameLabel =
    currentUser?.className || "Class Graduate";

  const categories = useMemo(
    () => [
      {
        actionLabel: "View Resources",
        description:
          "Open books, notes, PDFs, previous year papers and study resources.",
        illustration: <StudyMaterialsIllustration />,
        onAction: () =>
          router.push(courseRoutes.studyMaterials),
        title: "Study Materials",
      },
      {
        actionLabel: "Take Mock Tests",
        description:
          "Mock tests, previous year papers and complete practice tests.",
        illustration: <MockTestsIllustration />,
        onAction: () => router.push(courseRoutes.mockTests),
        title: "Test & Exam Practice",
      },
    ],
    [router]
  );

  return (
    <main className={styles.page}>
      <ImpersonationBanner />
      <BackgroundDecorations />

      <Header
        classNameLabel={classNameLabel}
        studentName={studentName}
      />

      <HeroSection />

      <section className={styles.cards}>
        {categories.map((category) => (
          <CourseCard
            key={category.title}
            actionLabel={category.actionLabel}
            description={category.description}
            illustration={category.illustration}
            onAction={category.onAction}
            title={category.title}
          />
        ))}
      </section>
    </main>
  );
}

function BackgroundDecorations() {
  return (
    <>
      <div className={`${styles.circleBg} ${styles.one}`} />
      <div className={`${styles.circleBg} ${styles.two}`} />
      <div className={`${styles.circleBg} ${styles.three}`} />

      <div className={`${styles.leafGroup} ${styles.left}`}>
        <div className={styles.leaf} />
        <div className={`${styles.leaf} ${styles.small}`} />
        <div className={styles.leaf} />
      </div>

      <div className={`${styles.leafGroup} ${styles.right}`}>
        <div className={`${styles.leaf} ${styles.small}`} />
        <div className={styles.leaf} />
        <div className={`${styles.leaf} ${styles.small}`} />
      </div>

      <div className={`${styles.leafGroup} ${styles.bottomLeft}`}>
        <div className={styles.leaf} />
        <div className={`${styles.leaf} ${styles.small}`} />
      </div>
    </>
  );
}

function StudyMaterialsIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 280 190"
      role="img"
    >
      <circle cx="145" cy="86" r="58" fill="#D9F7ED" />
      <circle cx="190" cy="96" r="42" fill="#EFFCF7" />
      <path
        d="M44 154h170"
        stroke="#0AA36F"
        strokeOpacity="0.4"
        strokeWidth="2"
      />
      <path d="M72 154V92" stroke="#058B5D" strokeWidth="2" />
      <path
        d="M72 126c-25-10-38 7-38 7s21 10 38-7Z"
        fill="#B9EFDC"
        stroke="#058B5D"
        strokeWidth="2"
      />
      <path
        d="M75 105c-20-25 6-48 6-48s13 29-6 48Z"
        fill="#B9EFDC"
        stroke="#058B5D"
        strokeWidth="2"
      />
      <path
        d="M79 124c23-15 42 4 42 4s-25 13-42-4Z"
        fill="#B9EFDC"
        stroke="#058B5D"
        strokeWidth="2"
      />
      <rect
        x="55"
        y="153"
        width="42"
        height="18"
        rx="4"
        fill="#EAFBF5"
        stroke="#058B5D"
      />
      <rect
        x="112"
        y="92"
        width="104"
        height="32"
        rx="8"
        fill="#0AA36F"
      />
      <rect
        x="112"
        y="123"
        width="110"
        height="32"
        rx="8"
        fill="#20C997"
      />
      <rect
        x="107"
        y="154"
        width="116"
        height="30"
        rx="8"
        fill="#FFFFFF"
        stroke="#058B5D"
      />
      <path
        d="M164 92v92"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeOpacity="0.75"
      />
    </svg>
  );
}

function MockTestsIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 280 190"
      role="img"
    >
      <circle cx="126" cy="86" r="58" fill="#D9F7ED" />
      <path
        d="M48 162h170"
        stroke="#0AA36F"
        strokeOpacity="0.4"
        strokeWidth="2"
      />
      <rect
        x="95"
        y="38"
        width="102"
        height="126"
        rx="10"
        fill="#FFFFFF"
        stroke="#0AA36F"
        strokeWidth="4"
      />
      <rect
        x="118"
        y="30"
        width="56"
        height="28"
        rx="7"
        fill="#EAFBF5"
        stroke="#058B5D"
        strokeWidth="3"
      />
      {[74, 101, 128].map((y) => (
        <g key={y}>
          <path
            d={`M116 ${y}l9 9 18-20`}
            fill="none"
            stroke="#0AA36F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M154 ${y + 2}h36`}
            stroke="#9FDCC8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d={`M154 ${y + 14}h25`}
            stroke="#C9EFE2"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ))}
      <path
        d="M202 146l26-78 20 10-35 74Z"
        fill="#0AA36F"
        stroke="#058B5D"
        strokeWidth="3"
      />
      <path
        d="M228 68l12-20 18 24Z"
        fill="#EAFBF5"
        stroke="#058B5D"
        strokeWidth="3"
      />
    </svg>
  );
}

function getStudentDisplayName(
  student: ReturnType<typeof useAuthSession>["currentUser"]
) {
  if (!student) {
    return "";
  }

  const fullName = [
    student.firstName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || student.name || "";
}
