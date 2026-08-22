"use client";

import { useEffect, useState } from "react";
import {
  Calculator,
  Clock3,
  CloudCheck,
  FileQuestion,
  Save,
  Send,
  Star,
  Timer,
} from "lucide-react";
import type { StudentExamAttempt } from "@repo/types";

import styles from "./StudentExamAttemptPage.module.css";
import type { SaveState } from "./studentExamAttempt.types";

type ExamHeaderProps = {
  attempt: StudentExamAttempt;
  maximumMarks: number;
  sectionDeadline: string | null;
  slotDeadline: string | null;
  serverOffsetMs: number;
  submitting: boolean;
  onSubmit: () => void;
};

export function ExamHeader({
  attempt,
  maximumMarks,
  sectionDeadline,
  slotDeadline,
  serverOffsetMs,
  submitting,
  onSubmit,
}: ExamHeaderProps) {
  const examDeadline = attempt.expiresAt;
  const timers = sectionDeadline
    ? [
        {
          deadline: sectionDeadline,
          label: "Section Remaining",
          tone: "purple" as const,
        },
        ...(slotDeadline
          ? [
              {
                deadline: slotDeadline,
                label: "Slot Remaining",
                tone: "green" as const,
              },
            ]
          : []),
      ]
    : slotDeadline
      ? [
          {
            deadline: slotDeadline,
            label: "Slot Remaining",
            tone: "green" as const,
          },
        ]
      : [
          {
            deadline: examDeadline,
            label: "Exam Remaining",
            tone: "purple" as const,
          },
        ];

  return (
    <header className={styles.examHeader}>
      <div className={styles.examIdentity}>
        <span className={styles.examIcon} aria-hidden="true">
          <Calculator size={28} strokeWidth={1.9} />
        </span>
        <div className={styles.examTitleBlock}>
          <h1>{attempt.title}</h1>
          <div className={styles.examMeta}>
            <span>
              <FileQuestion size={15} /> Attempt {attempt.attemptNumber} of{" "}
              {attempt.attemptLimit}
            </span>
            <span>
              <FileQuestion size={15} /> {attempt.questions.length} Questions
            </span>
            <span>
              <Star size={16} /> {formatMarks(maximumMarks)} Marks
            </span>
          </div>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.timerGroup}>
          {timers.map((timer) => (
            <ExamTimer
              deadline={timer.deadline}
              key={timer.label}
              label={timer.label}
              serverOffsetMs={serverOffsetMs}
              tone={timer.tone}
            />
          ))}
        </div>
        <button
          className={styles.submitExamButton}
          disabled={submitting}
          onClick={onSubmit}
          type="button"
        >
          <Send size={18} />
          {submitting ? "Submitting..." : "Submit Exam"}
        </button>
      </div>
    </header>
  );
}

function ExamTimer({
  deadline,
  label,
  serverOffsetMs,
  tone,
}: {
  deadline: string;
  label: string;
  serverOffsetMs: number;
  tone: "purple" | "green";
}) {
  const [now, setNow] = useState(() => Date.now() + serverOffsetMs);

  useEffect(() => {
    const syncTimer = window.setTimeout(
      () => setNow(Date.now() + serverOffsetMs),
      0,
    );
    const timer = window.setInterval(
      () => setNow(Date.now() + serverOffsetMs),
      1_000,
    );
    return () => {
      window.clearTimeout(syncTimer);
      window.clearInterval(timer);
    };
  }, [serverOffsetMs]);

  const remainingSeconds = Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - now) / 1_000),
  );
  const Icon = tone === "green" ? Clock3 : Timer;

  return (
    <div
      className={`${styles.timerCard} ${styles[tone]} ${remainingSeconds < 300 ? styles.timerUrgent : ""}`}
    >
      <Icon size={28} strokeWidth={1.9} />
      <div>
        <strong>{formatTime(remainingSeconds)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ExamStatusFooter({
  lastSavedAt,
  saveState,
  serverOffsetMs,
}: {
  lastSavedAt: string | null;
  saveState: SaveState;
  serverOffsetMs: number;
}) {
  const [serverNow, setServerNow] = useState(() => Date.now() + serverOffsetMs);

  useEffect(() => {
    const syncTimer = window.setTimeout(
      () => setServerNow(Date.now() + serverOffsetMs),
      0,
    );
    const timer = window.setInterval(
      () => setServerNow(Date.now() + serverOffsetMs),
      1_000,
    );
    return () => {
      window.clearTimeout(syncTimer);
      window.clearInterval(timer);
    };
  }, [serverOffsetMs]);

  const saveLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "error"
        ? "Save failed"
        : saveState === "saved"
          ? "Saved"
          : "Auto-save: On";

  return (
    <footer className={styles.statusFooter}>
      <span className={saveState === "error" ? styles.statusError : ""}>
        <CloudCheck size={18} /> {saveLabel}
      </span>
      <i aria-hidden="true" />
      <span>
        <Save size={18} /> Last saved{" "}
        {lastSavedAt ? formatClock(new Date(lastSavedAt)) : "Not yet"}
      </span>
      <i aria-hidden="true" />
      <span>
        <Clock3 size={18} /> Server time {formatClock(new Date(serverNow))}
      </span>
    </footer>
  );
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remaining = seconds % 60;
  return [hours, minutes, remaining]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatClock(value: Date) {
  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
