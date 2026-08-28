"use client";

import { useEffect, useRef } from "react";
import { AlarmClock, ArrowRight, Send } from "lucide-react";

import styles from "./StudentExamAttemptPage.module.css";

export function StudentExamTimeoutDialog({
  error,
  message,
  onContinue,
  resolving,
  scope,
}: {
  error: string | null;
  message: string;
  onContinue: () => void;
  resolving: boolean;
  scope: "EXAM" | "SLOT" | "SECTION";
}) {
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    actionRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const examExpired = scope === "EXAM";
  return (
    <div className={styles.submissionBackdrop}>
      <section
        aria-describedby="exam-timeout-description"
        aria-labelledby="exam-timeout-title"
        aria-modal="true"
        className={styles.submissionDialog}
        role="alertdialog"
      >
        <header className={styles.submissionHeader}>
          <span aria-hidden="true">
            <AlarmClock size={24} />
          </span>
          <div>
            <h2 id="exam-timeout-title">
              {examExpired
                ? "Exam time has ended"
                : `${scope === "SLOT" ? "Slot" : "Section"} time has ended`}
            </h2>
            <p id="exam-timeout-description">{message}</p>
          </div>
        </header>

        <div className={styles.submissionReview}>
          <AlarmClock size={18} />
          <div>
            <strong>Your saved answers are protected</strong>
            <span>
              {examExpired
                ? "The backend will calculate the result from answers saved before the deadline."
                : "The completed timed area is locked; continue to the next available question."}
            </span>
          </div>
        </div>

        {error ? (
          <p className={styles.submissionSaveError} role="alert">
            {error}
          </p>
        ) : null}

        <footer className={styles.submissionActions}>
          <button
            className={styles.confirmSubmitButton}
            disabled={resolving}
            onClick={onContinue}
            ref={actionRef}
            type="button"
          >
            {examExpired ? <Send size={17} /> : <ArrowRight size={17} />}
            {resolving
              ? "Processing..."
              : examExpired
                ? "Submit exam"
                : "Continue exam"}
          </button>
        </footer>
      </section>
    </div>
  );
}
