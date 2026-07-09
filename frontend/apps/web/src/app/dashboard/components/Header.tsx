"use client";

import {
  ChevronDown,
  GraduationCap,
  UserRound,
} from "lucide-react";

import styles from "./Dashboard.module.css";

export interface HeaderProps {
  classNameLabel: string;
  studentName: string;
}

export function Header({
  classNameLabel,
  studentName,
}: HeaderProps) {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <GraduationCap
          aria-hidden="true"
          size={38}
          strokeWidth={2.8}
        />
        <span>LMS</span>
      </div>

      <button
        className={styles.profile}
        type="button"
        aria-label={`Open profile for ${studentName}`}
      >
        <span className={styles.avatar}>
          <UserRound
            aria-hidden="true"
            size={18}
            strokeWidth={2}
          />
        </span>

        <span className={styles.profileText}>
          <span className={styles.profileName}>
            {studentName}
          </span>
          <span className={styles.profileClass}>
            {classNameLabel}
          </span>
        </span>

        <ChevronDown
          className={styles.chevron}
          aria-hidden="true"
          size={18}
          strokeWidth={2.6}
        />
      </button>
    </header>
  );
}
