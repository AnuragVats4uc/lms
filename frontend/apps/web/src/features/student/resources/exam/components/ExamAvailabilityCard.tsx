import { CalendarClock, Info } from "lucide-react";
import type { StudentExamResourceDetail } from "@repo/types";

import { unavailableActionLabel } from "../utils/examAccess";

type ExamAvailabilityCardProps = {
  data: StudentExamResourceDetail;
  onOpenExam: () => void;
  onOpenReason: () => void;
  startError: boolean;
  startPending: boolean;
};

export const ExamAvailabilityCard = ({
  data,
  onOpenExam,
  onOpenReason,
  startError,
  startPending,
}: ExamAvailabilityCardProps) => {
  const { exam } = data;
  const showReasonAction =
    exam.action === "VIEW_RESULT" &&
    ["ATTEMPT_LIMIT_EXHAUSTED", "EXAM_ENDED"].includes(exam.actionReason);

  const actionLabel = startPending
    ? "Starting exam..."
    : exam.action === "RESUME"
      ? "Resume exam"
      : exam.action === "VIEW_RESULT"
        ? "View result"
        : exam.action === "START"
          ? "Start exam"
          : unavailableActionLabel(exam.actionReason);

  return (
    <aside className="student-exam-card">
      <h2>Availability</h2>
      <p>
        <CalendarClock aria-hidden="true" size={16} /> Opens{" "}
        {new Date(exam.availableFrom).toLocaleString()}
      </p>
      <p>
        <CalendarClock aria-hidden="true" size={16} /> Closes{" "}
        {new Date(exam.availableUntil).toLocaleString()}
      </p>
      <h2>Instructions</h2>
      <p>
        {exam.instructions ??
          "Answer every question carefully. Submit before the timer ends."}
      </p>
      <button
        className="student-folder-primary-button exam-start"
        disabled={startPending}
        onClick={onOpenExam}
        type="button"
      >
        {actionLabel}
      </button>
      <div
        className="student-exam-action-note"
        data-tone={
          exam.actionReason === "READY" ||
          exam.actionReason === "ACTIVE_ATTEMPT"
            ? "positive"
            : "neutral"
        }
      >
        <Info aria-hidden="true" size={15} />
        <span>{exam.actionMessage}</span>
      </div>
      {showReasonAction ? (
        <button
          className="student-exam-reason-button"
          onClick={onOpenReason}
          type="button"
        >
          Why can&apos;t I start another attempt?
        </button>
      ) : null}
      {startError ? (
        <small role="alert">
          The exam could not be started. Review the message below.
        </small>
      ) : null}
    </aside>
  );
};
