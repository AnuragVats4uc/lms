import { GraduationCap } from "lucide-react";
import type { StudentCalendarEvent } from "@repo/types";
import styles from "../StudentCalendarPage.module.css";
import { statusLabels } from "../constant";
import { formatDateRange } from "../utils/calendarFormatting";

export const AcademicSessionBand = ({
  event,
  timezone,
}: {
  event?: StudentCalendarEvent;
  timezone: string;
}) =>
  event ? (
    <div className={styles.sessionBand}>
      <span className={styles.sessionIcon}>
        <GraduationCap aria-hidden="true" size={18} />
      </span>
      <div>
        <strong>{event.title}</strong>
        <span>Academic session · {formatDateRange(event, timezone)}</span>
      </div>
      <span className={styles.sessionStatus}>{statusLabels[event.status]}</span>
    </div>
  ) : null;
