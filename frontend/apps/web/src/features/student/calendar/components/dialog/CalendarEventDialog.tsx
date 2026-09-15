import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowUpRight, CalendarClock, GraduationCap, X } from "lucide-react";
import type { StudentCalendarEvent } from "@repo/types";
import styles from "../../StudentCalendarPage.module.css";
import { statusLabels } from "../../constant";
import { formatDateTime } from "../../utils/calendarFormatting";

export const CalendarEventDialog = ({
  event,
  onClose,
  timezone,
}: {
  event: StudentCalendarEvent;
  onClose: () => void;
  timezone: string;
}) => {
  const actionLabel = event.exam
    ? event.exam.activeAttemptUuid
      ? "Resume exam"
      : event.exam.attemptsUsed >= event.exam.attemptLimit
        ? "View exam"
        : event.status === "AVAILABLE"
          ? "Open exam"
          : "View exam"
    : "View details";
  return createPortal(
    <div
      aria-labelledby="calendar-event-title"
      aria-modal="true"
      className={styles.dialogBackdrop}
      onClick={onClose}
      role="dialog"
    >
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.dialogHeader} data-status={event.status}>
          <span className={styles.dialogIcon}>
            {event.type === "EXAM" ? (
              <CalendarClock aria-hidden="true" size={22} />
            ) : (
              <GraduationCap aria-hidden="true" size={22} />
            )}
          </span>
          <div>
            <span>
              {event.type === "EXAM" ? "EXAM SCHEDULE" : "ACADEMIC SESSION"}
            </span>
            <h2 id="calendar-event-title">{event.title}</h2>
          </div>
          <button
            aria-label="Close event details"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className={styles.dialogBody}>
          <span className={styles.dialogStatus} data-status={event.status}>
            {statusLabels[event.status]}
          </span>
          <p>
            {event.description ??
              (event.type === "EXAM"
                ? "Review the schedule and open the exam when its attempt window is available."
                : "Your enrolled academic session period.")}
          </p>
          <dl className={styles.detailGrid}>
            <div>
              <dt>Starts</dt>
              <dd>{formatDateTime(event.startsAt, timezone)}</dd>
            </div>
            <div>
              <dt>Ends</dt>
              <dd>{formatDateTime(event.endsAt, timezone)}</dd>
            </div>
            <div>
              <dt>Course</dt>
              <dd>
                {event.courses.map((course) => course.name).join(", ") ||
                  "All enrolled courses"}
              </dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>{event.session.name}</dd>
            </div>
            {event.exam ? (
              <>
                <div>
                  <dt>Duration</dt>
                  <dd>{event.exam.durationMinutes} minutes</dd>
                </div>
                <div>
                  <dt>Attempts</dt>
                  <dd>
                    {event.exam.attemptsUsed} of {event.exam.attemptLimit} used
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </div>
        <div className={styles.dialogFooter}>
          <button
            className={styles.dialogSecondary}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          {event.href ? (
            <Link className={styles.dialogPrimary} href={event.href}>
              {actionLabel}
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};
