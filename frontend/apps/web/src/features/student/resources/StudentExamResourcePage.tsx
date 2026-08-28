"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Info,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react";
import { studentsApi } from "@repo/api";
import type { StudentExamActionReason } from "@repo/types";

export function StudentExamResourcePage({
  resourceId,
}: {
  resourceId: number;
}) {
  const router = useRouter();
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessDialogMessage, setAccessDialogMessage] = useState<string | null>(
    null,
  );
  const query = useQuery({
    queryKey: ["student-exam-resource", resourceId],
    queryFn: () => studentsApi.findMyExamResource(resourceId),
    staleTime: 15_000,
  });
  const startMutation = useMutation({
    mutationFn: () => studentsApi.startMyExam(resourceId),
    onSuccess: (result) =>
      router.push(`/student/exam-attempts/${result.attemptUuid}`),
    onError: (error) => {
      setAccessDialogMessage(readApiError(error));
      setAccessDialogOpen(true);
      void query.refetch();
    },
  });
  if (query.isLoading)
    return (
      <div className="student-folder-state">
        <Trophy size={34} />
        <strong>Loading exam...</strong>
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="student-folder-state">
        <Trophy size={34} />
        <strong>This exam is unavailable or is not assigned to you.</strong>
        <button
          className="student-folder-primary-button"
          onClick={() => query.refetch()}
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  const data = query.data;
  const openExam = () => {
    if (data.exam.action === "RESUME" && data.exam.activeAttemptUuid) {
      router.push(`/student/exam-attempts/${data.exam.activeAttemptUuid}`);
      return;
    }
    if (data.exam.action === "VIEW_RESULT" && data.exam.latestAttemptUuid) {
      router.push(
        `/student/exam-attempts/${data.exam.latestAttemptUuid}/report`,
      );
      return;
    }
    if (data.exam.action === "UNAVAILABLE") {
      setAccessDialogMessage(null);
      setAccessDialogOpen(true);
      return;
    }
    startMutation.mutate();
  };
  const showReasonAction =
    data.exam.action === "VIEW_RESULT" &&
    ["ATTEMPT_LIMIT_EXHAUSTED", "EXAM_ENDED"].includes(
      data.exam.actionReason,
    );
  return (
    <main className="student-folder-page">
      <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
        <Link href="/student/my-courses">My Courses</Link>
        <span>/</span>
        <Link href={`/student/my-courses/${data.course.id}`}>
          {data.course.name}
        </Link>
        <span>/</span>
        <Link
          href={`/student/my-courses/${data.course.id}/folders/${data.folder.id}`}
        >
          {data.folder.name}
        </Link>
        <span>/</span>
        <span>{data.title}</span>
      </nav>
      <section className="student-exam-hero">
        <div>
          <span className="student-folder-eyebrow">{data.exam.code}</span>
          <h1>{data.exam.title}</h1>
          <p>
            {data.description ??
              "Read the instructions before starting this assessment."}
          </p>
        </div>
        <span
          className={`student-exam-availability ${data.exam.availability.toLowerCase()}`}
        >
          {data.exam.availability}
        </span>
      </section>
      <section className="student-exam-stat-grid">
        <ExamStat
          icon={Clock3}
          value={`${data.exam.durationMinutes} min`}
          label="Exam duration"
        />
        <ExamStat
          icon={FileQuestion}
          value={String(data.exam.questionCount)}
          label="Questions"
        />
        <ExamStat
          icon={Trophy}
          value={String(data.exam.maximumMarks)}
          label="Maximum marks"
        />
        <ExamStat
          icon={CheckCircle2}
          value={`${data.exam.attemptsUsed}/${data.exam.attemptLimit}`}
          label="Attempts used"
        />
      </section>
      <div className="student-exam-layout">
        <section className="student-exam-card">
          <h2>Sections</h2>
          {data.exam.sections.map((section) => (
            <article className="student-exam-section" key={section.id}>
              <div>
                <strong>{section.name}</strong>
                <span>{section.subjects.join(", ")}</span>
              </div>
              <div>
                <span>{section.questionCount} questions</span>
                <span>{section.durationMinutes} min</span>
                <span>{section.maximumMarks} marks</span>
              </div>
            </article>
          ))}
        </section>
        <aside className="student-exam-card">
          <h2>Availability</h2>
          <p>
            <CalendarClock size={16} /> Opens{" "}
            {new Date(data.exam.availableFrom).toLocaleString()}
          </p>
          <p>
            <CalendarClock size={16} /> Closes{" "}
            {new Date(data.exam.availableUntil).toLocaleString()}
          </p>
          <h2>Instructions</h2>
          <p>
            {data.exam.instructions ??
              "Answer every question carefully. Submit before the timer ends."}
          </p>
          <button
            className="student-folder-primary-button exam-start"
            disabled={startMutation.isPending}
            onClick={openExam}
          >
            {startMutation.isPending
              ? "Starting exam..."
              : data.exam.action === "RESUME"
                ? "Resume exam"
                : data.exam.action === "VIEW_RESULT"
                  ? "View result"
                  : data.exam.action === "START"
                    ? "Start exam"
                    : unavailableActionLabel(data.exam.actionReason)}
          </button>
          <div
            className="student-exam-action-note"
            data-tone={
              data.exam.actionReason === "READY" ||
              data.exam.actionReason === "ACTIVE_ATTEMPT"
                ? "positive"
                : "neutral"
            }
          >
            <Info size={15} />
            <span>{data.exam.actionMessage}</span>
          </div>
          {showReasonAction ? (
            <button
              className="student-exam-reason-button"
              onClick={() => {
                setAccessDialogMessage(null);
                setAccessDialogOpen(true);
              }}
              type="button"
            >
              Why can&apos;t I start another attempt?
            </button>
          ) : null}
          {startMutation.isError ? (
            <small role="alert">
              The exam could not be started. Review the message below.
            </small>
          ) : null}
        </aside>
      </div>
      <ExamAccessDialog
        message={accessDialogMessage ?? data.exam.actionMessage}
        onClose={() => setAccessDialogOpen(false)}
        open={accessDialogOpen}
        reason={data.exam.actionReason}
      />
    </main>
  );
}

function ExamAccessDialog({
  message,
  onClose,
  open,
  reason,
}: {
  message: string;
  onClose: () => void;
  open: boolean;
  reason: StudentExamActionReason;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);
  if (!open) return null;

  const isEnded = reason === "EXAM_ENDED";
  const isExhausted = reason === "ATTEMPT_LIMIT_EXHAUSTED";
  const Icon = isEnded ? CalendarX2 : isExhausted ? AlertTriangle : Info;
  const title = isEnded
    ? "This exam has ended"
    : isExhausted
      ? "Attempt limit reached"
      : reason === "EXAM_UPCOMING"
        ? "This exam has not opened yet"
        : reason === "RESUME_DISABLED"
          ? "This attempt cannot be resumed"
          : "Exam access information";

  return (
    <div
      className="student-exam-access-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        aria-labelledby="student-exam-access-title"
        aria-modal="true"
        className="student-exam-access-dialog"
        role="dialog"
      >
        <button
          aria-label="Close message"
          className="student-exam-access-close"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          <X size={17} />
        </button>
        <span className="student-exam-access-icon">
          <Icon size={25} />
        </span>
        <p>EXAM STATUS</p>
        <h2 id="student-exam-access-title">{title}</h2>
        <span>{message}</span>
        <div className="student-exam-access-guidance">
          <strong>What you can do</strong>
          <p>
            {isEnded || isExhausted
              ? "Open any released result from this page. If another attempt is required, contact your teacher or administrator."
              : "Check the availability details on this page. Contact your teacher if the schedule or access does not look correct."}
          </p>
        </div>
        <button
          className="student-folder-primary-button"
          onClick={onClose}
          type="button"
        >
          I understand
        </button>
      </section>
    </div>
  );
}

function unavailableActionLabel(reason: StudentExamActionReason) {
  if (reason === "EXAM_UPCOMING") return "Exam starts later";
  if (reason === "EXAM_ENDED") return "Exam ended";
  if (reason === "ATTEMPT_LIMIT_EXHAUSTED") return "Attempts exhausted";
  return "View access details";
}

function readApiError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(" ");
    if (typeof data.message === "string") return data.message;
  }
  return "The exam could not be started because its availability changed. Refresh the page and review the current status.";
}

function ExamStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
}) {
  return (
    <div className="student-exam-stat">
      <Icon size={20} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
