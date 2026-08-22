"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  CircleX,
  FileCheck2,
  Send,
  X,
} from "lucide-react";

import styles from "./StudentExamAttemptPage.module.css";

export type ExamSubmissionSummary = {
  answered: number;
  attemptNumber: number;
  marked: number;
  notVisited: number;
  sections: number;
  title: string;
  total: number;
  unanswered: number;
};

export function StudentExamSubmissionDialog({
  onCancel,
  onConfirm,
  saveFailed,
  submitting,
  summary,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saveFailed: boolean;
  submitting: boolean;
  summary: ExamSubmissionSummary;
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onCancel();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onCancel, submitting]);

  return (
    <div
      className={styles.submissionBackdrop}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !submitting) onCancel();
      }}
    >
      <section
        aria-describedby="exam-submit-description"
        aria-labelledby="exam-submit-title"
        aria-modal="true"
        className={styles.submissionDialog}
        role="dialog"
      >
        <button
          aria-label="Close submission summary"
          className={styles.submissionClose}
          disabled={submitting}
          onClick={onCancel}
          type="button"
        >
          <X size={18} />
        </button>

        <header className={styles.submissionHeader}>
          <span aria-hidden="true">
            <FileCheck2 size={24} />
          </span>
          <div>
            <h2 id="exam-submit-title">Submit exam?</h2>
            <p id="exam-submit-description">
              Review your exam summary before final submission.
            </p>
          </div>
        </header>

        <div className={styles.submissionExamMeta}>
          <strong>{summary.title}</strong>
          <span>
            Attempt {summary.attemptNumber} • {summary.sections}{" "}
            {summary.sections === 1 ? "section" : "sections"} • {summary.total}{" "}
            questions
          </span>
        </div>

        <div className={styles.submissionSummary}>
          <SummaryMetric
            icon={FileCheck2}
            label="Total"
            tone="submissionTotal"
            value={summary.total}
          />
          <SummaryMetric
            icon={CheckCircle2}
            label="Answered"
            tone="submissionAnswered"
            value={summary.answered}
          />
          <SummaryMetric
            icon={CircleX}
            label="Unanswered"
            tone="submissionUnanswered"
            value={summary.unanswered}
          />
          <SummaryMetric
            icon={Bookmark}
            label="Marked"
            tone="submissionMarked"
            value={summary.marked}
          />
        </div>

        <div className={styles.submissionReview}>
          <AlertTriangle size={18} aria-hidden="true" />
          <div>
            <strong>
              {summary.unanswered
                ? summary.unanswered +
                  " unanswered " +
                  (summary.unanswered === 1 ? "question" : "questions")
                : "All questions have an answer"}
            </strong>
            <span>
              {summary.notVisited
                ? summary.notVisited + " not visited"
                : "Every question was visited"}
              {summary.marked
                ? " • " + summary.marked + " marked for review"
                : " • Nothing marked for review"}
            </span>
          </div>
        </div>

        {saveFailed ? (
          <p className={styles.submissionSaveError} role="alert">
            Your current answer could not be saved. Please retry before
            submitting.
          </p>
        ) : null}

        <p className={styles.submissionNotice}>
          After submission, you cannot change your answers.
        </p>

        <footer className={styles.submissionActions}>
          <button
            className={styles.continueExamButton}
            disabled={submitting}
            onClick={onCancel}
            type="button"
          >
            Continue Exam
          </button>
          <button
            className={styles.confirmSubmitButton}
            disabled={submitting}
            onClick={onConfirm}
            ref={confirmButtonRef}
            type="button"
          >
            <Send size={17} />
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof FileCheck2;
  label: string;
  tone:
    | "submissionTotal"
    | "submissionAnswered"
    | "submissionUnanswered"
    | "submissionMarked";
  value: number;
}) {
  return (
    <div className={styles[tone]}>
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
