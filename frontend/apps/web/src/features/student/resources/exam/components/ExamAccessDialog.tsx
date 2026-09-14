import { useEffect, useRef } from "react";
import { AlertTriangle, CalendarX2, Info, X } from "lucide-react";
import type { StudentExamActionReason } from "@repo/types";

type ExamAccessDialogProps = {
  message: string;
  onClose: () => void;
  open: boolean;
  reason: StudentExamActionReason;
};

export const ExamAccessDialog = ({
  message,
  onClose,
  open,
  reason,
}: ExamAccessDialogProps) => {
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
};
