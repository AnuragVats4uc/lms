"use client";

import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import styles from "./Dashboard.module.css";

export interface CourseCardProps {
  actionLabel: string;
  description: string;
  illustration: ReactNode;
  onAction: () => void;
  title: string;
}

export function CourseCard({
  actionLabel,
  description,
  illustration,
  onAction,
  title,
}: CourseCardProps) {
  return (
    <article className={styles.courseCard}>
      <div className={styles.illustration}>
        {illustration}
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      <button
        className={styles.cardButton}
        type="button"
        onClick={onAction}
      >
        {actionLabel}
        <ArrowRight
          aria-hidden="true"
          size={16}
          strokeWidth={2.8}
        />
      </button>
    </article>
  );
}
